import { useId, useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import api from '../../api/client';
import { useCompany } from '../../contexts/CompanyContext';

const formatDate = (dateString) => {
  if (!dateString) return '—';
  try {
    
    const cleanDate = dateString.split(',')[0].trim(); 
    const date = new Date(cleanDate.replace(' ', 'T')); 
    if (isNaN(date.getTime())) return dateString; 

    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
};

function RefundCard({ refund }) {
  const [open, setOpen] = useState(false);
  const detailsId = useId();
  const statusClass = refund.status === 'succeeded'
    ? 'bg-emerald-100 text-emerald-700'
    : 'bg-amber-100 text-amber-700';

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {formatDate(refund.created)}
            </p>
            <p className="truncate font-mono text-xs text-slate-500">{refund.id}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              €{refund.amount.toFixed(2)}
            </p>
            <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClass}`}>
              {refund.status}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 flex-1 truncate rounded bg-slate-50 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {refund.reason || '—'}
          </p>
          <button
            type="button"
            className="flex shrink-0 items-center gap-1 text-xs font-medium text-indigo-600"
            aria-expanded={open}
            aria-controls={detailsId}
            onClick={() => setOpen((isOpen) => !isOpen)}
          >
            {open ? 'Close' : 'Open'}
            <ChevronDown
              aria-hidden="true"
              className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {open && (
        <dl
          id={detailsId}
          className="space-y-2 border-t border-slate-100 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-950"
        >
          <div className="flex gap-3">
            <dt className="w-24 shrink-0 text-slate-500">Refund ID</dt>
            <dd className="break-all font-mono text-slate-900 dark:text-slate-200">{refund.id}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-24 shrink-0 text-slate-500">Payment intent</dt>
            <dd className="break-all font-mono text-slate-900 dark:text-slate-200">
              {refund.payment_intent || '—'}
            </dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-24 shrink-0 text-slate-500">Date</dt>
            <dd className="text-slate-900 dark:text-slate-200">{formatDate(refund.created)}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-24 shrink-0 text-slate-500">Reason</dt>
            <dd className="break-words text-slate-900 dark:text-slate-200">{refund.reason || '—'}</dd>
          </div>
        </dl>
      )}
    </article>
  );
}

export default function Refunds() {
  const { activeCompany } = useCompany();
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

      <div className="space-y-3 md:hidden">
        {refunds.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
            No refunds found.
          </div>
        ) : refunds.map((refund) => (
          <RefundCard key={refund.id} refund={refund} />
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:block">
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
                <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">
                  {formatDate(r.created)}
                </td>
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