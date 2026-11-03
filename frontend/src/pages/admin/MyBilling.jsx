import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useCompany } from '../../contexts/CompanyContext';

export default function MyBilling() {
    const { activeCompany } = useCompany();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!activeCompany) return;
        loadInvoices();
    }, [activeCompany]);

    const loadInvoices = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/companies/${activeCompany.id}/platform-invoices`);
            setInvoices(res.data.data || res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const totalPending = invoices
        .filter(inv => inv.status === 'pending' || inv.status === 'overdue')
        .reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

    if (loading) return <div className="p-12 text-center text-slate-500">Loading...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">My Billing</h1>
                <p className="text-sm text-slate-500 mt-1">Shiko faturat e abonimit dhe statusin e pagesave.</p>
            </div>

            {/* Karta e përmbledhjes */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">Total Pending Amount</p>
                    <h2 className={`text-3xl font-bold mt-1 ${totalPending > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        €{totalPending.toFixed(2)}
                    </h2>
                </div>
                <div className="text-right">
                    <p className="text-sm font-medium text-slate-500">Total Invoices</p>
                    <h2 className="text-3xl font-bold text-slate-900 mt-1">{invoices.length}</h2>
                </div>
            </div>

            {/* Tabela e faturave */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Invoice</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Amount</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Due Date</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Paid At</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {invoices.length === 0 ? (
                            <tr><td colSpan="5" className="px-5 py-8 text-center text-sm text-slate-500">No invoices yet.</td></tr>
                        ) : invoices.map(inv => (
                            <tr key={inv.id} className="hover:bg-slate-50">
                                <td className="px-5 py-4 text-sm font-mono text-slate-700">{inv.invoice_number}</td>
                                <td className="px-5 py-4 text-sm font-bold text-slate-900">€{parseFloat(inv.amount).toFixed(2)}</td>
                                <td className="px-5 py-4 text-sm text-slate-500">{new Date(inv.due_date).toLocaleDateString()}</td>
                                <td className="px-5 py-4">
                                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                        inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                        inv.status === 'overdue' ? 'bg-red-100 text-red-700' :
                                        'bg-amber-100 text-amber-700'
                                    }`}>{inv.status}</span>
                                </td>
                                <td className="px-5 py-4 text-sm text-slate-500">
                                    {inv.paid_at ? new Date(inv.paid_at).toLocaleDateString() : '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}