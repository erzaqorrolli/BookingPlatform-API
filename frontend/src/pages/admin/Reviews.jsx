import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useCompany } from '../../contexts/CompanyContext';

export default function Reviews() {
  const { activeCompany } = useCompany();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ total: 0, average: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!activeCompany) return;

    const startLoading = window.setTimeout(() => {
      setLoading(true);
      setError('');
    }, 0);
    api.get(`/companies/${activeCompany.id}/reviews`)
      .then((response) => {
        setReviews(response.data.data?.reviews || []);
        setStats(response.data.data?.stats || { total: 0, average: 0 });
      })
      .catch((err) => setError(err.response?.data?.error || 'Could not load reviews'))
      .finally(() => setLoading(false));

    return () => window.clearTimeout(startLoading);
  }, [activeCompany]);

  if (!activeCompany) {
    return <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white p-12 text-center text-slate-500">Choose a company</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reviews</h1>
        <p className="mt-1 text-sm text-slate-500">Feedback left by your clients</p>
      </div>

      {error && <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Average rating</p>
          <p className="mt-1 text-3xl font-bold text-amber-500">{Number(stats.average || 0).toFixed(1)} <span className="text-xl">★</span></p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total reviews</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{stats.total || 0}</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">Loading...</div>
      ) : reviews.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
          <h3 className="text-lg font-semibold text-slate-900">No reviews yet</h3>
          <p className="mt-1 text-sm text-slate-500">Client feedback will appear here after completed bookings.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-slate-900">{review.user_name || 'Client'}</h3>
                  <p className="mt-1 text-sm text-slate-500">{review.service_name || 'Service'}</p>
                </div>
                <div className="whitespace-nowrap text-amber-500">{'★'.repeat(review.rating)}<span className="text-slate-200">{'★'.repeat(5 - review.rating)}</span></div>
              </div>
              {review.comment && <p className="mt-4 text-sm leading-6 text-slate-700">{review.comment}</p>}
              <p className="mt-4 text-xs text-slate-400">{review.created_at ? new Date(review.created_at).toLocaleDateString('sq-AL') : ''}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
