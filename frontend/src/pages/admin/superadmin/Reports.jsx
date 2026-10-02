import { useState, useEffect } from 'react';
import api from '../../../api/client';

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/superadmin/reports')
      .then((r) => setData(r.data.data))
      .catch((err) => console.error('Load reports error:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 dark:text-slate-400">
        Loading reports...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-12 text-center">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
          No data available
        </h3>
      </div>
    );
  }

  const {
    revenue = [],
    bookings = [],
    top_services = [],
    revenue_by_company = [],
    status_breakdown = {},
  } = data;

  const totalRevenue = revenue.reduce((sum, r) => sum + parseFloat(r.revenue || 0), 0);
  const totalInvoices = revenue.reduce((sum, r) => sum + parseInt(r.invoices_count || 0), 0);
  const totalBookings = bookings.reduce((sum, b) => sum + parseInt(b.bookings_count || 0), 0);

  const maxRevenue = Math.max(...revenue.map((r) => parseFloat(r.revenue || 0)), 1);
  const maxBookings = Math.max(...bookings.map((b) => parseInt(b.bookings_count || 0)), 1);

  const statusLabels = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No Show',
  };

  const statusColors = {
    pending: 'bg-amber-500',
    confirmed: 'bg-emerald-500',
    completed: 'bg-blue-500',
    cancelled: 'bg-red-500',
    no_show: 'bg-slate-500',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Reports
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Platform analytics · Last 12 months
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Total Revenue (12m)
          </div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            €{totalRevenue.toFixed(2)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {totalInvoices} invoices
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Total Bookings (12m)
          </div>
          <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">
            {totalBookings}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Across all companies
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Avg Revenue / Invoice
          </div>
          <div className="text-3xl font-bold text-violet-600 dark:text-violet-400 mt-2">
            €{totalInvoices > 0 ? (totalRevenue / totalInvoices).toFixed(2) : '0.00'}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Per paid invoice
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            Bookings by Status
          </h2>
        </div>
        <div className="p-5">
          {Object.keys(status_breakdown).length === 0 ? (
            <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-4">
              No data
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(status_breakdown).map(([status, count]) => (
                <div key={status} className="text-center">
                  <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${statusColors[status] || 'bg-slate-500'}`} />
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {count}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                    {statusLabels[status] || status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-white">
              Revenue by Month
            </h2>
          </div>
          <div className="p-5 space-y-3 max-h-[400px] overflow-y-auto">
            {revenue.length === 0 ? (
              <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-4">
                No revenue data
              </div>
            ) : (
              revenue.map((r) => {
                const width = maxRevenue > 0 ? (parseFloat(r.revenue) / maxRevenue) * 100 : 0;
                return (
                  <div key={r.month}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600 dark:text-slate-400">
                        {r.month}
                      </span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        €{parseFloat(r.revenue).toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2 rounded-full transition-all"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {r.invoices_count} invoices
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-white">
              Bookings by Month
            </h2>
          </div>
          <div className="p-5 space-y-3 max-h-[400px] overflow-y-auto">
            {bookings.length === 0 ? (
              <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-4">
                No booking data
              </div>
            ) : (
              bookings.map((b) => {
                const width = maxBookings > 0 ? (parseInt(b.bookings_count) / maxBookings) * 100 : 0;
                return (
                  <div key={b.month}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600 dark:text-slate-400">
                        {b.month}
                      </span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {b.bookings_count} bookings
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            Top 10 Services
          </h2>
        </div>
        {top_services.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No services data
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">#</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Service</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Company</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Bookings</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {top_services.map((s, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-5 py-3">
                      <span className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-slate-900 dark:text-white">
                      {s.service_name}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-700 dark:text-slate-300">
                      {s.company_name}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-700 dark:text-slate-300">
                      {s.bookings_count}
                    </td>
                    <td className="px-5 py-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400 text-right">
                      €{parseFloat(s.revenue).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            Revenue by Company
          </h2>
        </div>
        {revenue_by_company.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No company data
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Company</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Bookings</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {revenue_by_company.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-5 py-3 text-sm font-medium text-slate-900 dark:text-white">
                      {c.name}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-700 dark:text-slate-300">
                      {c.bookings_count}
                    </td>
                    <td className="px-5 py-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400 text-right">
                      €{parseFloat(c.revenue).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
