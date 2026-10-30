import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../../../api/client';
import { Link } from 'react-router-dom';
import { Building2, Users, Calendar, Euro, BarChart3, TrendingUp, AlertTriangle, Sparkles, ArrowRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SOCKET_URL = 'http://localhost:3001';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [topCompanies, setTopCompanies] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const socketRef = useRef(null);

  const loadDashboard = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [statsRes, recentRes, topRes, monthlyRes] = await Promise.all([
        api.get('/superadmin/stats'),
        api.get('/superadmin/recent-bookings'),
        api.get('/superadmin/top-companies'),
        api.get('/superadmin/monthly-revenue'),
      ]);
      setStats(statsRes.data.data);
      setRecentBookings(recentRes.data.data || []);
      setTopCompanies(topRes.data.data || []);
      setMonthlyRevenue(monthlyRes.data.data || []);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Dashboard WS connected');
      socket.emit('join-channel', 'superadmin');
      socket.emit('join-channel', 'admin');
      setLive(true);
    });

    socket.on('dashboard-update', (data) => {
      console.log('📊 Dashboard update received:', data);
      loadDashboard(true);
      setLastUpdate(new Date());
    });

    socket.on('disconnect', () => {
      console.log('❌ Dashboard WS disconnected');
      setLive(false);
    });

    return () => socket.disconnect();
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 dark:text-slate-400">
        Loading dashboard...
      </div>
    );
  }

  const statCards = [
    { label: 'Total Companies', value: stats?.total_companies || 0, icon: <Building2 size={24} />, bg: 'bg-indigo-50', color: 'text-indigo-600', link: '/admin/superadmin/companies' },
    { label: 'Total Users', value: stats?.total_users || 0, icon: <Users size={24} />, bg: 'bg-blue-50', color: 'text-blue-600', link: '/admin/superadmin/users' },
    { label: 'Total Bookings', value: stats?.total_bookings || 0, icon: <Calendar size={24} />, bg: 'bg-emerald-50', color: 'text-emerald-600', link: '/admin/superadmin/bookings' },
    { label: 'Total Revenue', value: `€${(stats?.total_revenue || 0).toFixed(2)}`, icon: <Euro size={24} />, bg: 'bg-amber-50', color: 'text-amber-600', link: '/admin/superadmin/reports' },
    { label: 'Bookings Today', value: stats?.bookings_today || 0, icon: <BarChart3 size={24} />, bg: 'bg-pink-50', color: 'text-pink-600', link: '/admin/superadmin/bookings?filters=today' },
    { label: 'This Month', value: stats?.bookings_this_month || 0, icon: <TrendingUp size={24} />, bg: 'bg-violet-50', color: 'text-violet-600', link: '/admin/superadmin/bookings?filter=month' },
    { label: 'Priority Bookings', value: stats?.priority_bookings || 0, icon: <AlertTriangle size={24} />, bg: 'bg-red-50', color: 'text-red-600', link: '/admin/superadmin/bookings?filter=priority' },
    { label: 'New Companies', value: stats?.new_companies_this_month || 0, icon: <Sparkles size={24} />, bg: 'bg-cyan-50', color: 'text-cyan-600', link: '/admin/superadmin/companies?filter=new' },
  ];

  const chartData = monthlyRevenue.map(m => ({
    month: m.month,
    revenue: Number(m.revenue)
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Super Admin Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Platform overview across all companies</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {live ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full font-medium">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Live
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full font-medium">
              <span className="w-2 h-2 bg-slate-400 rounded-full" /> Offline
            </span>
          )}
          {lastUpdate && (
            <span className="text-slate-400">Updated {lastUpdate.toLocaleTimeString()}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Link key={card.label} to={card.link} className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer">
            <div className={`p-2 rounded-lg ${card.bg} ${card.color} w-fit mb-3 group-hover:scale-110 transition-transform`}>
              {card.icon}
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{card.value}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
              <span>{card.label}</span>
              <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-6">Revenue Trend (Last 12 Months)</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value) => [`€${value.toFixed(2)}`, 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-white">Top Performing Companies</h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {topCompanies.length === 0 ? (
              <p className="p-5 text-sm text-slate-500">No companies yet.</p>
            ) : topCompanies.map((c, i) => (
              <div key={c.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">{c.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{c.bookings_count} bookings</div>
                  </div>
                </div>
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">€{parseFloat(c.revenue).toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <h2 className="font-semibold text-slate-900 dark:text-white">Recent Bookings</h2>
            <Link to="/admin/superadmin/bookings" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  {['Ref', 'Customer', 'Date', 'Status', 'Total'].map((h) => (
                    <th key={h} className={`px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase ${h === 'Total' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentBookings.slice(0, 5).map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 text-sm font-mono text-indigo-600 dark:text-indigo-400">{b.reference}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{b.customer_name}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{new Date(b.booking_date).toLocaleDateString('en-GB')}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-700 dark:text-slate-300 capitalize">{b.status}</span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white text-right">€{parseFloat(b.total_price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}