import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../../api/client';
import Swal from 'sweetalert2';

export default function CompanyDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCompany = async () => {
      setLoading(true);
      try {
        const r = await api.get(`/superadmin/companies/${id}`);
        setData(r.data.data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.error || 'Failed to load company');
      } finally {
        setLoading(false);
      }
    };
    loadCompany();
  }, [id]);

 const handleToggleStatus = async () => {
  if (!data?.company) return;
  const company = data.company;
  const isBlocking = company.status !== 'blocked';

  if (isBlocking) {
    const { value: reason } = await Swal.fire({
      title: 'Block company?',
      html: `Are you sure you want to block <b>${company.name}</b>?`,
      input: 'textarea',
      inputLabel: 'Reason for blocking',
      inputPlaceholder: 'Type the reason here...',
      showCancelButton: true,
      confirmButtonText: 'Block',
      confirmButtonColor: '#dc2626',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value) return 'You need to write a reason!';
      },
    });

    if (!reason) return;

    try {
      await api.put(`/superadmin/companies/${company.id}/status`, {
        status: 'blocked',
        reason: reason,
      });

      const r = await api.get(`/superadmin/companies/${company.id}`);
      setData(r.data.data);

      Swal.fire({
        icon: 'success',
        title: 'Blocked!',
        text: `"${company.name}" has been blocked.`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error('Block error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.error || err.message || 'Action failed',
      });
    }
  } else {
    const result = await Swal.fire({
      title: 'Activate company?',
      html: `Are you sure you want to activate <b>${company.name}</b>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Activate',
      confirmButtonColor: '#059669',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    try {
      await api.put(`/superadmin/companies/${company.id}/status`, {
        status: 'active',
        reason: '',
      });

      const r = await api.get(`/superadmin/companies/${company.id}`);
      setData(r.data.data);

      Swal.fire({
        icon: 'success',
        title: 'Activated!',
        text: `"${company.name}" has been activated.`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error('Activate error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.error || err.message || 'Action failed',
      });
    }
  }
};

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 dark:text-slate-400">
        Loading company...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <Link to="/admin/superadmin/companies" className="text-indigo-600 dark:text-indigo-400 hover:underline">
          ← Back to companies
        </Link>
      </div>
    );
  }

  if (!data?.company) {
    return (
      <div className="p-12 text-center text-slate-500">
        Company not found
      </div>
    );
  }

  const { company, stats, staff, recent_bookings } = data;

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/admin/superadmin/companies"
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          ← Back to companies
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {company.name}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {company.email} · {company.slug}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {company.status === 'blocked' ? (
            <span className="text-xs font-semibold px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full">
              Blocked
            </span>
          ) : (
            <span className="text-xs font-semibold px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full">
              Active
            </span>
          )}
          <button
            onClick={handleToggleStatus}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg ${
              company.status === 'blocked'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            {company.status === 'blocked' ? 'Activate' : 'Block'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <StatCard label="Bookings" value={stats.total_bookings} />
        <StatCard label="Services" value={stats.total_services} />
        <StatCard label="Customers" value={stats.total_customers} />
        <StatCard label="Products" value={stats.total_products} />
        <StatCard label="Staff" value={stats.total_staff} />
        <StatCard label="Revenue" value={`€${parseFloat(stats.total_revenue ?? 0).toFixed(2)}`} />
      </div>

      {/* Company info */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Details</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-xs text-slate-500 dark:text-slate-400 uppercase">Owner</dt>
            <dd className="text-sm text-slate-900 dark:text-white mt-1">
              {company.owner_name || '—'} ({company.owner_email || '—'})
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500 dark:text-slate-400 uppercase">Created</dt>
            <dd className="text-sm text-slate-900 dark:text-white mt-1">
              {company.created_at ? new Date(company.created_at).toLocaleString() : '—'}
            </dd>
          </div>
        </dl>
      </div>

      {/* Staff */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Staff ({staff.length})</h2>
        </div>
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Name</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Email</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Role</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {staff.map((u) => (
              <tr key={u.id}>
                <td className="px-5 py-3 text-sm text-slate-900 dark:text-white">{u.name}</td>
                <td className="px-5 py-3 text-sm text-slate-500 dark:text-slate-400">{u.email}</td>
                <td className="px-5 py-3 text-sm text-slate-700 dark:text-slate-300 capitalize">{u.role}</td>
                <td className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400">
                  {u.joined_at ? new Date(u.joined_at).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Bookings</h2>
        </div>
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Reference</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Customer</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Service</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Date</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Status</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {recent_bookings.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-sm text-slate-500">
                  No bookings yet
                </td>
              </tr>
            )}
            {recent_bookings.map((b) => (
              <tr key={b.id}>
                <td className="px-5 py-3 text-xs font-mono text-slate-900 dark:text-white">{b.reference}</td>
                <td className="px-5 py-3 text-sm text-slate-700 dark:text-slate-300">{b.customer_name}</td>
                <td className="px-5 py-3 text-sm text-slate-700 dark:text-slate-300">{b.service_name}</td>
                <td className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400">
                  {b.booking_date} {b.start_time}
                </td>
                <td className="px-5 py-3 text-xs capitalize text-slate-700 dark:text-slate-300">{b.status}</td>
                <td className="px-5 py-3 text-sm font-bold text-emerald-600 dark:text-emerald-400 text-right">
                  €{parseFloat(b.total_price ?? 0).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase">{label}</p>
      <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
    </div>
  );
}