import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';

const formatCurrency = (value) => `€${Number(value || 0).toFixed(2)}`;

export default function Dashboard() {
  const { user } = useAuth();
  const { activeCompany } = useCompany();
  const [services, setServices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeCompany) {
      setServices([]);
      setCustomers([]);
      setBookings([]);
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
          setServices([]);
          setCustomers([]);
          setBookings([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [activeCompany]);

  const today = new Date();
  const todayDate = today.toISOString().split('T')[0];

  const todaysBookings = bookings.filter((booking) => {
    if (!booking.booking_date) return false;
    const bookingDate = new Date(booking.booking_date);
    return bookingDate.toDateString() === today.toDateString();
  });

  const todaysClients = new Set(
    todaysBookings
      .map((booking) => booking.customer_email || booking.customer_name || booking.customer_id)
      .filter(Boolean)
  ).size;

  const thisMonthIncome = bookings
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
  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.booking_date) - new Date(a.booking_date))
    .slice(0, 5);

  const stats = [
    { label: 'Todays Bookings', value: String(todaysBookings.length), change: '+0%', color: 'indigo' },
    { label: 'Todays Clients', value: String(todaysClients), change: '+0%', color: 'emerald' },
    { label: 'Monthly incomings', value: formatCurrency(thisMonthIncome), change: '+0%', color: 'amber' },
    { label: 'Active services', value: String(activeServiceCount), change: `${services.length} total`, color: 'purple' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">Welcome, {user?.name}!</h1>
        <p className="text-indigo-100 mt-1">
          {activeCompany ? `Manage ${activeCompany.name} in your panel` : 'Create your first company to start'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-md transition">
            <p className="text-sm text-slate-500 mb-2">{stat.label}</p>
            <div className="flex items-end justify-between gap-2">
              <p className="text-3xl font-bold text-slate-900 break-words">{stat.value}</p>
              <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded whitespace-nowrap">
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Last bookings</h3>

          {loading ? (
            <div className="text-center py-8 text-slate-400 text-sm">Loading...</div>
          ) : recentBookings.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              There are no bookings!
            </div>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
                  <div>
                    <p className="font-medium text-slate-900">{booking.customer_name || 'Client'}</p>
                    <p className="text-xs text-slate-500">{booking.service_name || 'Service'} · {booking.booking_date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{booking.status}</p>
                    <p className="text-xs text-slate-500">{booking.total_price ? formatCurrency(booking.total_price) : '€0.00'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Fast Services</h3>
          <div className="space-y-2">
            <button className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition text-sm font-medium">
              + Add new service
            </button>
            <button className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition text-sm font-medium">
              + Create manual booking
            </button>
            <button className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition text-sm font-medium">
              + Add group members
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}