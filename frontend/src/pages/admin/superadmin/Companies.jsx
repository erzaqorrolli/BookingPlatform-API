import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../api/client';
 import Swal from 'sweetalert2';
export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const r = await api.get('/superadmin/companies');
      setCompanies(r.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

 

const handleToggleStatus = async (company) => {
  const newStatus = company.status === 'blocked' ? 'active' : 'blocked';

  if (newStatus === 'blocked') {
    // Kërko arsyen me SweetAlert
    const { value: reason } = await Swal.fire({
      title: 'Block company?',
      text: `Are you sure you want to block "${company.name}"?`,
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
      await api.put(`/superadmin/companies/${company.id}/status`, {
        status: newStatus,
        reason,
      });
      await loadCompanies();

      Swal.fire({
        icon: 'success',
        title: 'Blocked!',
        text: `"${company.name}" has been blocked.`,
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
    // Aktivizo pa pyetje
    const result = await Swal.fire({
      title: 'Activate company?',
      text: `Are you sure you want to activate "${company.name}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Activate',
      confirmButtonColor: '#059669',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    try {
      await api.put(`/superadmin/companies/${company.id}/status`, {
        status: newStatus,
        reason: '',
      });
      await loadCompanies();

      Swal.fire({
        icon: 'success',
        title: 'Activated!',
        text: `"${company.name}" has been activated.`,
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

  const handleDelete = async (company) => {
    if (!confirm(`Fshi kompaninë "${company.name}"? This can not be undone!`)) return;

    try {
      await api.delete(`/superadmin/companies/${company.id}`);
      await loadCompanies();
    } catch (err) {
      alert(err.response?.data?.error || 'Deletion failed');
    }
  };

  const filtered = companies.filter((c) => {
    if (filterStatus && c.status !== filterStatus) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        c.name?.toLowerCase().includes(s) ||
        c.email?.toLowerCase().includes(s) ||
        c.slug?.toLowerCase().includes(s) ||
        c.owner_email?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 dark:text-slate-400">
        Loading companies...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Companies
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {filtered.length} of {companies.length} companies
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, owner..."
          className="flex-1 min-w-[200px] px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-lg text-sm focus:border-indigo-500 outline-none"
        />

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-lg text-sm focus:border-indigo-500 outline-none"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>

        {(search || filterStatus) && (
          <button
            onClick={() => {
              setSearch('');
              setFilterStatus('');
            }}
            className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-12 text-center">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
            No companies found
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
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Company</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Owner</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Bookings</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Services</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Customers</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Revenue</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                  >
                    <td className="px-5 py-4">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {c.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {c.slug}
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-500">
                        {c.email}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {c.owner_email ? (
                        <>
                          <div className="text-sm text-slate-900 dark:text-white">
                            {c.owner_name || '—'}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {c.owner_email}
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">
                      {c.bookings_count}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">
                      {c.services_count}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">
                      {c.customers_count}
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      €{parseFloat(c.revenue).toFixed(2)}
                    </td>
                    <td className="px-5 py-4">
                      {c.status === 'blocked' ? (
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
                          to={`/admin/superadmin/companies/${c.id}`}
                          className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleToggleStatus(c)}
                          className={`text-xs font-medium ${
                            c.status === 'blocked'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                          } hover:underline`}
                        >
                          {c.status === 'blocked' ? 'Activate' : 'Block'}
                        </button>
                        {c.slug !== 'platform-admin' && (
                          <button
                            onClick={() => handleDelete(c)}
                            className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
                          >
                            Delete
                          </button>
                        )}
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