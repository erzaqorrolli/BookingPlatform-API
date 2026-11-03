import { useState, useEffect } from 'react';
import api from '../../../api/client';
import Swal from 'sweetalert2';

export default function Billing() {
    const [invoices, setInvoices] = useState([]);
    const [companies, setCompanies] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ company_id: '', amount: '', due_date: '' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [invoicesResult, companiesResult] = await Promise.allSettled([
            api.get('/superadmin/platform-invoices'),
            api.get('/superadmin/companies'),
        ]);

        if (invoicesResult.status === 'fulfilled') {
            setInvoices(invoicesResult.value.data.data || []);
        } else {
            console.error('Failed to load platform invoices:', invoicesResult.reason);
        }

        if (companiesResult.status === 'fulfilled') {
            const companiesData = companiesResult.value.data.data || [];
            setCompanies(companiesData.filter(c =>
                c.slug !== 'platform-admin' &&
                c.name !== 'Platform Admin'
            ));
        } else {
            console.error('Failed to load companies:', companiesResult.reason);
        }

        setLoading(false);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/superadmin/platform-invoices', form);
            setShowModal(false);
            setForm({ company_id: '', amount: '', due_date: '' });
            loadData(); 
            Swal.fire({ icon: 'success', title: 'Invoice created!', timer: 1500, showConfirmButton: false });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error });
        }
    };

    const handleMarkPaid = async (id) => {
        try {
            await api.put(`/superadmin/platform-invoices/${id}/paid`);
            loadData();
            Swal.fire({ icon: 'success', title: 'Marked as paid!', timer: 1500, showConfirmButton: false });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error });
        }
    };

    if (loading) return <div className="p-12 text-center text-slate-500">Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Platform Billing</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage subscription invoices for companies.</p>
                </div>
                <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                    + New Invoice
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Invoice</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Company</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Amount</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Due Date</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                            <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {invoices.length === 0 ? (
                            <tr><td colSpan="6" className="px-5 py-8 text-center text-sm text-slate-500">No invoices yet.</td></tr>
                        ) : invoices.map(inv => (
                            <tr key={inv.id} className="hover:bg-slate-50">
                                <td className="px-5 py-4 text-sm font-mono text-slate-700">{inv.invoice_number}</td>
                                <td className="px-5 py-4 text-sm text-slate-700">{inv.company_name}</td>
                                <td className="px-5 py-4 text-sm font-bold text-slate-900">€{parseFloat(inv.amount).toFixed(2)}</td>
                                <td className="px-5 py-4 text-sm text-slate-500">{new Date(inv.due_date).toLocaleDateString()}</td>
                                <td className="px-5 py-4">
                                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                        inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                        inv.status === 'overdue' ? 'bg-red-100 text-red-700' :
                                        'bg-amber-100 text-amber-700'
                                    }`}>{inv.status}</span>
                                </td>
                                <td className="px-5 py-4 text-right">
                                    {inv.status !== 'paid' && (
                                        <button onClick={() => handleMarkPaid(inv.id)} className="text-xs font-medium text-emerald-600 hover:underline">
                                            Mark as Paid
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Create Invoice</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
                                <select required value={form.company_id} onChange={e => setForm({...form, company_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                                    <option value="">Select company</option>
                                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Amount (€)</label>
                                <input required type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                                <input required type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">Cancel</button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}