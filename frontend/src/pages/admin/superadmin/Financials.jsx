
import {useState,useEffect} from 'react';
import api from '../../../api/client';

export default function Financials() {
    const [stats,setStats]=useState(null);
    const[loading,setLoading]=useState(true);

    useEffect(() =>{
        api.get('/superadmin/financial-stats').then(res=> setStats(res.data.data || res.data))
        .catch(err => console.error(err))
        .finally(()=>setLoading(false));
    },[]);

    if(loading) {return <div className="p-12 text-center text-slate-500">Loading financial data...</div>;
    }

    if (!stats) {
        return <div className="p-12 text-center text-red-500">Failed to load financial data.</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Financial Reports</h1>
                <p className="text-sm text-slate-500 mt-1">Overview of platform revenue and pending payments.</p>
            </div>

            {/* Kartat Kryesore */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">Total Revenue</p>
                    <h2 className="text-3xl font-bold text-emerald-600 mt-2">€{stats.total_revenue.toFixed(2)}</h2>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">This Month</p>
                    <h2 className="text-3xl font-bold text-indigo-600 mt-2">€{stats.current_month_revenue.toFixed(2)}</h2>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">Pending Payments</p>
                    <h2 className="text-3xl font-bold text-amber-600 mt-2">€{stats.pending_amount.toFixed(2)}</h2>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">Total Invoices</p>
                    <h2 className="text-3xl font-bold text-slate-900 mt-2">{stats.total_invoices}</h2>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900">Top Companies with Pending Payments</h3>
                </div>
                <table className="w-full">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Company</th>
                            <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Amount Due</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {stats.top_debtors.length === 0 ? (
                            <tr>
                                <td colSpan="2" className="px-5 py-4 text-center text-sm text-slate-500">No pending payments</td>
                            </tr>
                        ) : stats.top_debtors.map((d, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                                <td className="px-5 py-4 text-sm font-medium text-slate-900">{d.company_name}</td>
                                <td className="px-5 py-4 text-sm text-right text-red-600 font-semibold">€{parseFloat(d.debt).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Të ardhurat mujore (Listë) */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-bold text-slate-900 mb-4">Revenue (Last 6 Months)</h3>
                <div className="space-y-3">
                    {stats.monthly_revenue.length === 0 ? (
                        <p className="text-sm text-slate-500">No revenue data yet.</p>
                    ) : stats.monthly_revenue.map((m, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <span className="text-sm text-slate-500 w-24">{m.month}</span>
                            <div className="flex-1 bg-slate-100 rounded-full h-4">
                                <div 
                                    className="bg-indigo-500 h-4 rounded-full" 
                                    style={{ width: `${Math.min(100, (m.revenue / stats.total_revenue) * 100)}%` }}
                                ></div>
                            </div>
                            <span className="text-sm font-semibold text-slate-900 w-24 text-right">€{parseFloat(m.revenue).toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );



    }
