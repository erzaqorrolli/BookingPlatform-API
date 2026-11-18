import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useCompany } from '../../contexts/CompanyContext';
import { usePermissions } from '../../contexts/PermissionsContext';

export default function Refunds() {
  const { activeCompany } = useCompany();
  const { hasPermission } = usePermissions();
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!activeCompany?.id) return;

    const fetchRefunds = async () => {
      try {
        const res = await api.get(`/companies/${activeCompany.id}/refunds`);
        setRefunds(res.data.data.refunds || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load refunds');
      } finally {
        setLoading(false);
      }
    };

    fetchRefunds();
  }, [activeCompany]);

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Loading refunds...</div>;
  }

  if (error) {
    return <div className="p-12 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Refunds</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          View all refunds processed for {activeCompany?.name}.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Refund ID</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Payment Intent</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Amount</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {refunds.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-5 py-8 text-center text-slate-500">
                  No refunds found.
                </td>
              </tr>
            ) : refunds.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">{r.created}</td>
                <td className="px-5 py-4 text-sm font-mono text-slate-900 dark:text-white">{r.id}</td>
                <td className="px-5 py-4 text-sm font-mono text-slate-500">{r.payment_intent}</td>
                <td className="px-5 py-4 text-sm font-bold text-right text-slate-900 dark:text-white">
                  €{r.amount.toFixed(2)}
                </td>
                <td className="px-5 py-4">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    r.status === 'succeeded' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-slate-500">{r.reason || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}