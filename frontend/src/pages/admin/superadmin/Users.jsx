import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../api/client';
import Swal from 'sweetalert2';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterRole) params.role = filterRole;

      const r = await api.get('/superadmin/users', { params });
      setUsers(r.data.data || []);
    } catch (err) {
      console.error('Load users error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [search, filterRole]);

const handleToggleStatus = async (user) => {
  const isBlocking = user.status !== 'blocked';

  if (isBlocking) {
    // ============ BLOCK ============
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
      await loadUsers();

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
    // ============ UNBLOCK / ACTIVATE ============
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
      await loadUsers();

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

const handleDelete = async (user) => {
  const result = await Swal.fire({
    title: 'Delete user?',
    html: `Are you sure you want to delete <b>${user.name}</b>?<br/><span style="color:#dc2626;font-size:13px">This action cannot be undone!</span>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Delete',
    confirmButtonColor: '#dc2626',
    cancelButtonText: 'Cancel',
  });

  if (!result.isConfirmed) return;

  try {
    await api.delete(`/superadmin/users/${user.id}`);
    await loadUsers();

    Swal.fire({
      icon: 'success',
      title: 'Deleted!',
      text: `"${user.name}" has been deleted.`,
      timer: 2000,
      showConfirmButton: false,
    });
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: err.response?.data?.error || 'Delete failed',
    });
  }
};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            All Users
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {users.length} users on the platform
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="flex-1 min-w-[200px] px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-lg text-sm focus:border-indigo-500 outline-none"
        />

        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-lg text-sm focus:border-indigo-500 outline-none"
        >
          <option value="">All roles</option>
          <option value="superadmin">Super Admin</option>
          <option value="owner">Owner</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="staff">Staff</option>
          <option value="customer">Customer</option>
        </select>

        {(search || filterRole) && (
          <button
            onClick={() => {
              setSearch('');
              setFilterRole('');
            }}
            className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-500 dark:text-slate-400">
          Loading users...
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-12 text-center">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
            No users found
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Try changing your search or filter
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">User</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Roles</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Companies</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Verified</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Registered</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">
                            {u.name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(u.roles || '').split(', ').filter(Boolean).map((role) => (
                          <span
                            key={role}
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              role === 'superadmin'
                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                : role === 'owner'
                                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                : role === 'admin'
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                : role === 'manager'
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                : role === 'staff'
                                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">
                      {u.companies || '—'}
                    </td>
                    <td className="px-5 py-4">
                      {u.email_verified_at ? (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400">
                          ✓ Verified
                        </span>
                      ) : (
                        <span className="text-xs text-amber-600 dark:text-amber-400">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">
                      {new Date(u.created_at).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-5 py-4">
                      {u.status === 'blocked' ? (
                        <span className="text-xs font-semibold px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full">
                          Blocked
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/superadmin/users/${u.id}`}
                          className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`text-xs font-medium ${
                            u.status === 'blocked'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                          } hover:underline`}
                        >
                          {u.status === 'blocked' ? 'Activate' : 'Block'}
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}