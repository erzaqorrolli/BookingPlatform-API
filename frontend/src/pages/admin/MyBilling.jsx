import { useState, useEffect, useCallback } from 'react';
import api from '../../api/client';
import { useCompany } from '../../contexts/CompanyContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function MyBilling() {
    const { activeCompany } = useCompany();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const loadInvoices = useCallback(async () => {
        if (!activeCompany) return;
        setLoading(true);
        try {
            const res = await api.get(`/companies/${activeCompany.id}/platform-invoices`);
            setInvoices(res.data.data || res.data || []);
            setCurrentPage(1);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [activeCompany]);

    useEffect(() => {
        const initialLoad = window.setTimeout(loadInvoices, 0);
        return () => window.clearTimeout(initialLoad);
    }, [loadInvoices]);

    const totalPending = invoices
        .filter(inv => inv.status === 'pending' || inv.status === 'overdue')
        .reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

    const totalPages = Math.ceil(invoices.length / itemsPerPage);
    const displayedPage = Math.min(currentPage, Math.max(totalPages, 1));
    const startIndex = (displayedPage - 1) * itemsPerPage;
    const paginatedInvoices = invoices.slice(startIndex, startIndex + itemsPerPage);

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
                        ) : paginatedInvoices.map(inv => (
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
                {invoices.length > itemsPerPage && (
                    <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200 bg-slate-50">
                        <div className="text-sm text-slate-500">
                            Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                            <span className="font-medium">{Math.min(startIndex + itemsPerPage, invoices.length)}</span> of{' '}
                            <span className="font-medium">{invoices.length}</span> invoices
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                disabled={displayedPage === 1}
                                aria-label="Previous page"
                                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-medium text-slate-700 px-2">
                                Page {displayedPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                disabled={displayedPage === totalPages}
                                aria-label="Next page"
                                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}