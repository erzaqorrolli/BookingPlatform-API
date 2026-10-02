import { useState, useEffect } from 'react';
import api from '../../../api/client';

const STATUS_COLORS = {
  pending: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  confirmed: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  completed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  no_show: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
};

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filter, setFilter] = useState('');
  const [limit, setLimit] = useState(100);
  const [offset, setOffset] = useState(0);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const params = { limit, offset };
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      if (filter) params.filter = filter;

      const r = await api.get('/superadmin/bookings', { params });
      setBookings(r.data.data?.bookings || []);
      setTotal(r.data.data?.total || 0);
    } catch (err) {
      console.error('Load bookings error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [search, filterStatus, filter, limit, offset]);

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  const handleNextPage = () => {
    if (offset + limit < total) setOffset(offset + limit);
  };

  const handlePrevPage = () => {
    if (offset > 0) setOffset(Math.max(0, offset - limit));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            All Bookings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {total} bookings across all companies
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOffset(0); }}
          placeholder="Search by reference, customer, company..."
          className="flex-1 min-w-[200px] px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-lg text-sm focus:border-indigo-500 outline-none"
        />

        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setOffset(0); }}
          className="px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-lg text-sm focus:border-indigo-500 outline-none"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no_show">No show</option>
        </select>

        <select
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setOffset(0); }}
          className="px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-lg text-sm focus:border-indigo-500 outline-none"
        >
          <option value="">All time</option>
          <option value="today">Today</option>
          <option value="month">This month</option>
          <option value="priority">Priority only</option>
        </select>

        {(search || filterStatus || filter) && (
          <button
            onClick={() => {
              setSearch('');
              setFilterStatus('');
              setFilter('');
              setOffset(0);
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
          Loading bookings...
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-12 text-center">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
            No bookings found
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Try changing your search or filter
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Reference</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Company</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Customer</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Service</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Date</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Status</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {bookings.map((b) => (
                    <tr
                      key={b.id}
                      className={b.needs_assistance ? 'bg-amber-50 dark:bg-amber-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}
                    >
                      <td className="px-5 py-3">
                        <div className="text-sm font-mono text-indigo-600 dark:text-indigo-400">
                          {b.reference}
                        </div>
                        {b.needs_assistance === 1 && (
                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-xs font-semibold bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 rounded-full">
                            ⚠️ Priority
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-700 dark:text-slate-300">
                        {b.company_name}
                      </td>
                      <td className="px-5 py-3">
                        <div className="text-sm text-slate-900 dark:text-white font-medium">
                          {b.customer_name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {b.customer_email}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-700 dark:text-slate-300">
                        {b.service_name}
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-700 dark:text-slate-300">
                        {new Date(b.booking_date).toLocaleDateString('en-GB')}
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {b.start_time?.slice(0, 5)}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[b.status] || 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm font-medium text-slate-900 dark:text-white text-right">
                        €{parseFloat(b.total_price).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={offset === 0}
                  className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300"
                >
                  ← Previous
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={offset + limit >= total}
                  className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}