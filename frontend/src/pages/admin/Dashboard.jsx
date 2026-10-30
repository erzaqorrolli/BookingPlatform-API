import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';
import { Link } from 'react-router-dom';
import { Calendar, Users, Euro, Package, Plus, ArrowRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const formatCurrency = (value) => `€${Number(value || 0).toFixed(2)}`;

export default function Dashboard() {
  const { user } = useAuth();
  const { activeCompany } = useCompany();
  const [services, setServices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('all'); 

  useEffect(() => {
    if (!activeCompany) {
      setServices([]); setCustomers([]); setBookings([]);
      return;
    }

    let isMounted = true;
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [servicesRes, customersRes, bookingsRes] = await Promise.all([
          api.get(`/companies/${activeCompany.id}/services`),
          api.get(`/companies/${activeCompany.id}/customers`),
          api.get(`/companies/${activeCompany.id}/bookings`),
        ]);

        if (!isMounted) return;

        setServices(servicesRes.data?.data || []);
        setCustomers(customersRes.data?.data || []);
        setBookings(bookingsRes.data?.data || []);
      } catch (err) {
        console.error('Dashboard load failed', err);
        if (isMounted) {
          setServices([]); setCustomers([]); setBookings([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDashboardData();
    return () => { isMounted = false; };
  }, [activeCompany]);

  const today = new Date();

  const filteredBookings = bookings.filter((b) => {
    if (filterType === 'vip') return Number(b.is_vip) === 1;
    if (filterType === 'ada') return Number(b.needs_ada_help) === 1;
    return true;
  });

  const todaysBookings = filteredBookings.filter((booking) => {
    if (!booking.booking_date) return false;
    return new Date(booking.booking_date).toDateString() === today.toDateString();
  });

  const todaysClients = new Set(
    todaysBookings.map((b) => b.customer_email || b.customer_name || b.customer_id).filter(Boolean)
  ).size;

  const thisMonthIncome = filteredBookings
    .filter((booking) => {
      if (!booking.booking_date) return false;
      const bookingDate = new Date(booking.booking_date);
      return (
        bookingDate.getMonth() === today.getMonth() &&
        bookingDate.getFullYear() === today.getFullYear()
      );
    })
    .reduce((total, booking) => total + Number(booking.total_price || 0), 0);

  const activeServiceCount = services.filter((service) => Number(service.active) === 1).length;
  
  const recentBookings = [...filteredBookings]
    .sort((a, b) => new Date(b.booking_date) - new Date(a.booking_date))
    .slice(0, 5);

  // Top Services (nga filteredBookings)
  const serviceCounts = {};
  filteredBookings.forEach(b => {
    if (b.service_name) {
      serviceCounts[b.service_name] = (serviceCounts[b.service_name] || 0) + 1;
    }
  });
  const topServices = Object.entries(serviceCounts).sort(([,a], [,b]) => b - a).slice(0, 4);

  // Grafiku (nga filteredBookings)
  const chartData = [];
  for (let i = 14; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const count = filteredBookings.filter(b => b.booking_date && b.booking_date.split('T')[0] === dateStr).length;
    chartData.push({
      date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      bookings: count,
    });
  }

  const stats = [
    { label: 'Todays Bookings', value: String(todaysBookings.length), icon: <Calendar className="w-6 h-6" />, bgColor: 'bg-indigo-50', iconColor: 'text-indigo-600' },
    { label: 'Todays Clients', value: String(todaysClients), icon: <Users className="w-6 h-6" />, bgColor: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    { label: 'Monthly incomings', value: formatCurrency(thisMonthIncome), icon: <Euro className="w-6 h-6" />, bgColor: 'bg-amber-50', iconColor: 'text-amber-600' },
    { label: 'Active services', value: String(activeServiceCount), icon: <Package className="w-6 h-6" />, bgColor: 'bg-purple-50', iconColor: 'text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Header dhe Butonat */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            {activeCompany ? `Welcome back, ${user?.name}! Here's what's happening.` : 'Create your first company to start'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/calendar" className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm">
            <Calendar size={16} /> View Calendar
          </Link>
          <Link to="/admin/bookings" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-sm">
            <Plus size={16} /> New Booking
          </Link>
        </div>
      </div>

      {/* FILTRAT E POROSIVE */}
      <div className="flex gap-2">
        <button onClick={() => setFilterType('all')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filterType === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
          All Bookings
        </button>
        <button onClick={() => setFilterType('vip')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filterType === 'vip' ? 'bg-amber-500 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
          VIP Clients Only
        </button>
        <button onClick={() => setFilterType('ada')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filterType === 'ada' ? 'bg-orange-500 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
          Needs Assistance
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${stat.bgColor} ${stat.iconColor}`}>{stat.icon}</div>
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Grafiku */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-6">Booking Activity (Last 15 Days)</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Area type="monotone" dataKey="bookings" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorBookings)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Last Bookings & Top Services */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Last Bookings</h3>
            <Link to="/admin/bookings" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {loading ? (
            <div className="text-center py-8 text-slate-400 text-sm">Loading...</div>
          ) : recentBookings.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">No bookings match this filter.</div>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
                  <div>
                    <p className="font-medium text-slate-900">{booking.customer_name || 'Client'}</p>
                    <p className="text-xs text-slate-500">{booking.service_name || 'Service'} · {booking.booking_date}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold mb-1 ${
                      booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                      booking.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                    }`}>{booking.status}</span>
                    <p className="text-xs text-slate-500">{booking.total_price ? formatCurrency(booking.total_price) : '€0.00'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Most Popular Services</h3>
          {topServices.length === 0 ? (
            <p className="text-sm text-slate-500">No data for this filter.</p>
          ) : (
            <div className="space-y-4">
              {topServices.map(([name, count]) => (
                <div key={name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-700 font-medium truncate pr-2">{name}</span>
                    <span className="text-slate-500 whitespace-nowrap">{count} bookings</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${(count / topServices[0][1]) * 100}%` }}></div>
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