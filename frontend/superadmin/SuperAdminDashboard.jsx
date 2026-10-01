import { useState, useEffect } from 'react';
import api from '../../../api/client';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [topCompanies, setTopCompanies] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/superadmin/stats'),
      api.get('/superadmin/recent-bookings'),
      api.get('/superadmin/top-companies'),
      api.get('/superadmin/monthly-revenue'),
    ])
      .then(([statsRes, recentRes, topRes, monthlyRes]) => {
        setStats(statsRes.data.data);
        setRecentBookings(recentRes.data.data || []);
        setTopCompanies(topRes.data.data || []);
        setMonthlyRevenue(monthlyRes.data.data || []);
      })
      .catch((err) => console.error('Dashboard error:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 dark:text-slate-400">
        Loading dashboard...
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Companies',
      value: stats?.total_companies || 0,
      icon: '🏢',
      color: 'from-indigo-500 to-purple-600',
    },
    {
      label: 'Total Users',
      value: stats?.total_users || 0,
      icon: '👥',
      color: 'from-blue-500 to-cyan-600',
    },
    {
      label: 'Total Bookings',
      value: stats?.total_bookings || 0,
      icon: '📅',
      color: 'from-emerald-500 to-teal-600',
    },
    {
      label: 'Total Revenue',
      value: `€${(stats?.total_revenue || 0).toFixed(2)}`,
      icon: '💰',
      color: 'from-amber-500 to-orange-600',
    },
    {
      label: 'Bookings Today',
      value: stats?.bookings_today || 0,
      icon: '📊',
      color: 'from-pink-500 to-rose-600',
    },
    {
      label: 'This Month',
      value: stats?.bookings_this_month || 0,
      icon: '📈',
      color: 'from-violet-500 to-purple-600',
    },
    {
      label: 'Priority Bookings',
      value: stats?.priority_bookings || 0,
      icon: '⚠️',
      color: 'from-red-500 to-orange-600',
    },
    {
      label: 'New Companies',
      value: stats?.new_companies_this_month || 0,
      icon: '✨',
      color: 'from-cyan-500 to-blue-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Super Admin Dashboard
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Platform overview across all companies
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5"
          >
            <div
              className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-lg flex items-center justify-center text-2xl mb-3`}
            >
              {card.icon}
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {card.value}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {card.label}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            Recent Bookings
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Reference
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Company
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Customer
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Service
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Date
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Status
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentBookings.map((b) => (
                <tr
                  key={b.id}
                  className={
                    b.needs_assistance
                      ? 'bg-amber-50 dark:bg-amber-900/20'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }
                >
                  <td className="px-5 py-3 text-sm font-mono text-indigo-600 dark:text-indigo-400">
                    {b.reference}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-700 dark:text-slate-300">
                    {b.company_name}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-700 dark:text-slate-300">
                    {b.customer_name}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-700 dark:text-slate-300">
                    {b.service_name}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-700 dark:text-slate-300">
                    {new Date(b.booking_date).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-700 dark:text-slate-300 capitalize">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-white">
              Top Companies
            </h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {topCompanies.map((c, i) => (
              <div key={c.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      {c.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {c.bookings_count} bookings
                    </div>
                  </div>
                </div>
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  €{parseFloat(c.revenue).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-white">
              Monthly Revenue (Last 12 months)
            </h2>
          </div>
          <div className="p-5 space-y-3">
            {monthlyRevenue.map((m) => {
              const maxRevenue = Math.max(...monthlyRevenue.map((x) => parseFloat(x.revenue)));
              const width = maxRevenue > 0 ? (parseFloat(m.revenue) / maxRevenue) * 100 : 0;
              return (
                <div key={m.month}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 dark:text-slate-400">
                      {m.month}
                    </span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      €{parseFloat(m.revenue).toFixed(2)}
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
            })}
          </div>
        </div>
      </div>
    </div>
  );
}