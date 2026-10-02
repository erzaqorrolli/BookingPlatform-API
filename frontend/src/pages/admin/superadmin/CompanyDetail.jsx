import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../../api/client';

export default function CompanyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/superadmin/companies/${id}`);
      setData(r.data.data);
    } catch (err) {
      console.error('Load company error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleToggleStatus = async () => {
    const company = data?.company;
    if (!company) return;

    const newStatus = company.status === 'blocked' ? 'active' : 'blocked';
    const reason = newStatus === 'blocked'
      ? prompt('Reason for blocking:') || 'No reason provided'
      : '';

    if (newStatus === 'blocked' && reason === null) return;

    setActionLoading(true);
    try {
      await api.put(`/superadmin/companies/${company.id}/status`, {
        status: newStatus,
        reason: reason,
      });
      await loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    const company = data?.company;
    if (!company) return;

    if (!confirm(`Delete company "${company.name}"? This cannot be undone!`)) return;
    if (!confirm(`Are you ABSOLUTELY sure? All bookings, services, and customers will be deleted.`)) return;

    setActionLoading(true);
    try {
      await api.delete(`/superadmin/companies/${company.id}`);
      navigate('/admin/superadmin/companies');
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed');
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 dark:text-slate-400">
        Loading company...
      </div>
    );
  }

  if (!data || !data.company) {
    return (
      <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-12 text-center">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
          Company not found
        </h3>
        <Link
          to="/admin/superadmin/companies"
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          ← Back to companies
        </Link>
      </div>
    );
  }

  const { company, stats, staff = [], recent_bookings = [] } = data;
  const isBlocked = company.status === 'blocked';
  const isPlatformAdmin = company.slug === 'platform-admin';

  const statCards = [
    { label: 'Bookings', value: stats?.total_bookings || 0, icon: '📅', color: 'from-indigo-500 to-purple-600' },
    { label: 'Customers', value: stats?.total_customers || 0, icon: '👥', color: 'from-blue-500 to-cyan-600' },
    { label: 'Services', value: stats?.total_services || 0, icon: '🛠️', color: 'from-emerald-500 to-teal-600' },
    { label: 'Products', value: stats?.total_products || 0, icon: '📦', color: 'from-amber-500 to-orange-600' },
    { label: 'Staff', value: stats?.total_staff || 0, icon: '👔', color: 'from-pink-500 to-rose-600' },
    { label: 'Revenue', value: `€${parseFloat(stats?.total_revenue || 0).toFixed(2)}`, icon: '💰', color: 'from-violet-500 to-purple-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link
          to="/admin/superadmin/companies"
          className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to companies
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleStatus}
            disabled={actionLoading || isPlatformAdmin}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 ${
              isBlocked
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-amber-600 text-white hover:bg-amber-700'
            }`}
          >
            {isBlocked ? 'Activate Company' : 'Block Company'}
          </button>
          {!isPlatformAdmin && (
            <button
              onClick={handleDelete}
              disabled={actionLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition disabled:opacity-50"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Company Info Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-start gap-5 flex-wrap">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {company.name?.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {company.name}
              </h1>
              {isBlocked ? (
                <span className="text-xs font-semibold px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full">
                  Blocked
                </span>
              ) : (
                <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full">
                  Active
                </span>
              )}
              {isPlatformAdmin && (
                <span className="text-xs font-semibold px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                  Platform
                </span>
              )}
            </div>

            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 space-y-0.5">
              <div><strong>Slug:</strong> {company.slug}</div>
              {company.email && <div><strong>Email:</strong> {company.email}</div>}
              {company.phone && <div><strong>Phone:</strong> {company.phone}</div>}
              {company.address && <div><strong>Address:</strong> {company.address}</div>}
              <div><strong>Registered:</strong> {new Date(company.created_at).toLocaleDateString('en-GB')}</div>
            </div>

            {isBlocked && company.blocked_reason && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
                <strong>Blocked:</strong> {company.blocked_reason}
              </div>
            )}
          </div>

          {/* Owner */}
          {company.owner_email && (
            <div className="border-l border-slate-200 dark:border-slate-700 pl-5">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                Owner
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                {company.owner_name || '—'}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {company.owner_email}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4"
          >
            <div className={`w-10 h-10 bg-gradient-to-br ${card.color} rounded-lg flex items-center justify-center text-xl mb-2`}>
              {card.icon}
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {card.value}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {card.label}
            </div>
          </div>
        ))}
      </div>

      {/* Two columns: Staff + Recent Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Staff */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-white">
              Staff ({staff.length})
            </h2>
          </div>
          {staff.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No staff members
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[400px] overflow-y-auto">
              {staff.map((s) => (
                <div key={s.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                      {s.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        {s.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {s.email}
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    s.role === 'owner'
                      ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                      : s.role === 'admin'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : s.role === 'manager'
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                  }`}>
                    {s.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Bookings */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-white">
              Recent Bookings
            </h2>
          </div>
          {recent_bookings.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No bookings yet
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[400px] overflow-y-auto">
              {recent_bookings.map((b) => (
                <div
                  key={b.id}
                  className={`px-5 py-3 ${b.needs_assistance ? 'bg-amber-50 dark:bg-amber-900/20' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400">
                      {b.reference}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full capitalize">
                      {b.status}
                    </span>
                  </div>
                  <div className="text-sm text-slate-900 dark:text-white font-medium">
                    {b.customer_name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex justify-between">
                    <span>{b.service_name}</span>
                    <span>
                      {new Date(b.booking_date).toLocaleDateString('en-GB')} · {b.start_time?.slice(0, 5)}
                    </span>
                  </div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                    €{parseFloat(b.total_price).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}