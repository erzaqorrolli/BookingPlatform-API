import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../../api/client';
import Swal from 'sweetalert2';

export default function UserDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    try {
      const r = await api.get(`/superadmin/users/${id}`);
      setData(r.data.data);
    } catch (err) {
      console.error('Load user error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!data?.user) return;
    const user = data.user;
    const isBlocking = user.status !== 'blocked';

    if (isBlocking) {
      const { value: reason } = await Swal.fire({
        title: 'Block user?',
        html: `Are you sure you want to block <b>${user.name}</b>?`,
        input: 'textarea',
        inputLabel: 'Reason for blocking',
        inputPlaceholder: 'Type the reason here...',
        inputAttributes: {
          'aria-label': 'Reason for blocking',
        },
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
        await api.put(`/superadmin/users/${user.id}/status`, {
          status: 'blocked',
          reason: reason,
        });
        await loadUser();

        Swal.fire({
          icon: 'success',
          title: 'Blocked!',
          text: `"${user.name}" has been blocked.`,
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.response?.data?.error || 'Action failed',
        });
      }
    } else {
      const result = await Swal.fire({
        title: 'Activate user?',
        html: `Are you sure you want to activate <b>${user.name}</b>?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Activate',
        confirmButtonColor: '#059669',
        cancelButtonText: 'Cancel',
      });

      if (!result.isConfirmed) return;

      try {
        await api.put(`/superadmin/users/${user.id}/status`, {
          status: 'active',
          reason: '',
        });
        await loadUser();

        Swal.fire({
          icon: 'success',
          title: 'Activated!',
          text: `"${user.name}" has been activated.`,
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.response?.data?.error || 'Action failed',
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 dark:text-slate-400">
        Loading user...
      </div>
    );
  }

  if (!data || !data.user) {
    return (
      <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-12 text-center">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
          User not found
        </h3>
        <Link
          to="/admin/superadmin/users"
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          ← Back to users
        </Link>
      </div>
    );
  }

  const { user, companies = [], customer, stats } = data;

  return (
    <div className="space-y-6">
      <Link
        to="/admin/superadmin/users"
        className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to users
      </Link>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-start gap-5 flex-wrap">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {user.name}
              </h1>
              {user.status === 'blocked' ? (
                <span className="text-xs font-semibold px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full">
                  Blocked
                </span>
              ) : (
                <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full">
                  Active
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {user.email}
            </p>
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
              <span>
                {user.email_verified_at ? '✓ Email verified' : '⚠ Email not verified'}
              </span>
              <span>•</span>
              <span>
                Joined {new Date(user.created_at).toLocaleDateString('en-GB')}
              </span>
              <span>•</span>
              <span>ID: {user.id}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user.status === 'blocked' ? (
              <button
                onClick={handleToggleStatus}
                className="text-xs font-semibold px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition"
              >
                Unblock
              </button>
            ) : (
              <button
                onClick={handleToggleStatus}
                className="text-xs font-semibold px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition"
              >
                Block
              </button>
            )}
          </div>
        </div>
      </div>

      {customer && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Total Bookings
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
              {stats.total_bookings || 0}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Total Spent
            </div>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
              €{parseFloat(stats.total_spent || 0).toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {/* Companies */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            Companies ({companies.length})
          </h2>
        </div>
        {companies.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            This user is not a member of any company
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {companies.map((c) => (
              <div
                key={c.company_id}
                className="px-5 py-4 flex items-center justify-between flex-wrap gap-2"
              >
                <div>
                  <Link
                    to={`/admin/superadmin/companies/${c.company_id}`}
                    className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {c.company_name}
                  </Link>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {c.company_slug}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      c.role === 'owner'
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                        : c.role === 'admin'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : c.role === 'manager'
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                        : c.role === 'staff'
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {c.role}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(c.joined_at).toLocaleDateString('en-GB')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Customer Profile */}
      {customer && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-white">
              Customer Profile
            </h2>
          </div>
          <div className="p-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Customer ID</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {customer.id}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Name</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {customer.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Email</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {customer.email}
              </span>
            </div>
            {customer.phone && (
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Phone</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {customer.phone}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Company ID</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {customer.company_id}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}