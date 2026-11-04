import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useCompany } from '../../contexts/CompanyContext';

export default function CompanyAuditLogs() {
    const { activeCompany } = useCompany();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!activeCompany) return;
        loadLogs();
    }, [activeCompany]);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/companies/${activeCompany.id}/audit-logs`);
            setLogs(res.data.data || res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatDetails = (action, metadata) => {
        try {
            const data = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
            
            switch (action) {
                case 'booking.status_update':
                    return `Status changed in: ${data.status || 'N/A'}`;
                case 'booking.created':
                    return `New booking for ${data.customer_name || 'client'} në ${data.date || ''}`;
                case 'booking.cancelled':
                    return `Booking cancelled: ${data.reason || 'No reason'}`;
                case 'customer.created':
                    return `New client: ${data.name || 'N/A'} (${data.email || ''})`;
                case 'customer.deleted':
                    return `Client deleted: ${data.name || 'N/A'}`;
                case 'staff.invited':
                    return `Invited staff: ${data.email || 'N/A'} me rolin ${data.role || ''}`;
                case 'settings.updated':
                    return `Settings update`;
                default:
                    return Object.entries(data)
                        .filter(([key]) => key !== 'company_id')
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(', ');
            }
        } catch (e) {
            return '—';
        }
    };

    const filtered = logs.filter(log => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            log.action?.toLowerCase().includes(q) ||
            log.user_name?.toLowerCase().includes(q) ||
            log.user_email?.toLowerCase().includes(q)
        );
    });

    if (loading) return <div className="p-12 text-center text-slate-500">Loading...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Activity Log</h1>
                <p className="text-sm text-slate-500 mt-1">View what staff and admin did in your company.</p>
            </div>

            <div className="relative max-w-md">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by user or action..."
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
                />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">User</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Action</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.length === 0 ? (
                            <tr><td colSpan="4" className="px-5 py-8 text-center text-sm text-slate-500">No activity.</td></tr>
                        ) : filtered.map(log => (
                            <tr key={log.id} className="hover:bg-slate-50">
                                <td className="px-5 py-4 text-sm text-slate-500">
                                    {new Date(log.created_at).toLocaleString('sq-AL')}
                                </td>
                                <td className="px-5 py-4">
                                    <div className="text-sm font-medium text-slate-900">{log.user_name || 'System'}</div>
                                    <div className="text-xs text-slate-500">{log.user_email}</div>
                                </td>
                                <td className="px-5 py-4">
                                    <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-700">
                                        {log.action}
                                    </span>
                                </td>
                                <td className="px-5 py-4 text-sm text-slate-700">
                                    {log.metadata ? formatDetails(log.action, log.metadata) : '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}