import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';

export default function StaffDashboard() {
  const { user } = useAuth();
  const { activeCompany } = useCompany();
  const [todayBookings, setTodayBookings] = useState([]);
  const [todayShift, setTodayShift] = useState(null);
  const [payroll, setPayroll] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeCompany) return;

    const today = new Date().toISOString().split('T')[0];

    Promise.all([
      api.get(`/companies/${activeCompany.id}/bookings`, {
        params: { date: today },
      }),
      api.get(`/companies/${activeCompany.id}/schedule/me`, {
        params: { start: today, end: today },
      }),
      api.get(`/companies/${activeCompany.id}/payroll/me`),
    ])
      .then(([bookingsRes, scheduleRes, payrollRes]) => {
        setTodayBookings(bookingsRes.data.data || []);
        const shifts = scheduleRes.data.data || [];
        setTodayShift(shifts[0] || null);
        setPayroll(payrollRes.data.data || null);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [activeCompany]);

  const now = new Date();
  const currentHour = now.getHours();

  const greeting =
    currentHour < 12 ? 'Good Morning' :
    currentHour < 18 ? 'Good Afterenoon' :
    'Mirëmbrëma';

  const updateStatus = async (bookingId, newStatus) => {
    try {
      await api.put(
        `/companies/${activeCompany.id}/bookings/${bookingId}/status`,
        { status: newStatus }
      );

      const today = new Date().toISOString().split('T')[0];
      const r = await api.get(`/companies/${activeCompany.id}/bookings`, {
        params: { date: today },
      });
      setTodayBookings(r.data.data || []);
    } catch (err) {
      alert(err.response?.data?.error || 'Change failed');
    }
  };

  const stats = {
    total: todayBookings.length,
    pending: todayBookings.filter((b) => b.status === 'pending').length,
    confirmed: todayBookings.filter((b) => b.status === 'confirmed').length,
    completed: todayBookings.filter((b) => b.status === 'completed').length,
  };

  if (!activeCompany) {
    return (
      <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Choose a company</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg shadow-orange-500/20">
        <h1 className="text-2xl font-bold">
          {greeting}, {user?.name?.split(' ')[0]}! 
        </h1>
        <p className="text-orange-100 mt-1">
          {todayShift ? (
            <>
              Today's shift: <strong>{todayShift.shift_name}</strong> · {todayShift.shift_start.slice(0, 5)} - {todayShift.shift_end.slice(0, 5)}
            </>
          ) : (
            'You do not have a shift for today'
          )}
        </p>
      </div>

      {/* Payroll */}
<div className="bg-white rounded-xl border border-slate-200 p-6">
  <div className="flex items-start justify-between gap-4">
    <div>
      <h2 className="font-bold text-slate-900">My payroll</h2>
      <p className="text-sm text-slate-500 mt-1">
        {payroll?.configured
          ? `${payroll.hourly_rate}€/hour · ${payroll.total_hours}h worked`
          : 'Your hourly rate has not been configured yet'}
      </p>
    </div>
    <div className="w-11 h-11 bg-emerald-100 rounded-lg flex items-center justify-center">
      <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  </div>

  {payroll?.configured ? (
    <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
      <div>
        <p className="text-xs text-slate-500">Unpaid total</p>
        <p className="text-2xl font-bold text-emerald-600">
          €{Number(payroll.total || 0).toFixed(2)}
        </p>
      </div>
      <div>
        <p className="text-xs text-slate-500">Hours worked</p>
        <p className="font-semibold text-slate-900">
          {Number(payroll.total_hours || 0).toFixed(2)}h
        </p>
      </div>
      <div>
        <p className="text-xs text-slate-500">Shifts completed</p>
        <p className="font-semibold text-slate-900">
          {payroll.shifts_count || 0}
        </p>
      </div>
    </div>
  ) : (
    <div className="mt-5 p-4 bg-slate-50 rounded-lg text-sm text-slate-500 text-center">
      Your salary has not been configured yet.
    </div>
  )}
</div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          <p className="text-xs text-slate-500 mt-0.5">Today's total</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
          <p className="text-xs text-slate-500 mt-0.5">Waiting</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{stats.confirmed}</p>
          <p className="text-xs text-slate-500 mt-0.5">Confirmed</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
          <p className="text-xs text-slate-500 mt-0.5">Done</p>
        </div>
      </div>

      {/* Today's bookings */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-bold text-slate-900">Today's booking</h2>
            <p className="text-sm text-slate-500">
              {new Date().toLocaleDateString('sq-AL', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
          </div>
          <Link
            to="/staff/bookings"
            className="text-sm font-medium text-orange-600 hover:text-orange-700"
          >
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading...</div>
        ) : todayBookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">No bookings today</h3>
            <p className="text-sm text-slate-500">Quiet day! </p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayBookings.map((b) => (
              <div
                key={b.id}
                className="flex flex-col sm:flex-row sm:items-center gap-4 border border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition"
              >
                <div className="text-center sm:w-20 shrink-0">
                  <div className="text-lg font-bold text-slate-900">
                    {b.start_time?.slice(0, 5)}
                  </div>
                  <div className="text-xs text-slate-400">
                    {b.end_time?.slice(0, 5)}
                  </div>
                </div>

                <div className="flex-1 min-w-0 sm:border-l sm:border-slate-200 sm:pl-4">
                  <div className="font-medium text-slate-900">{b.customer_name}</div>
                  <div className="text-sm text-slate-500">{b.service_name}</div>
                  {b.customer_phone && (
                    <a
                      href={`tel:${b.customer_phone}`}
                      className="text-xs text-orange-600 hover:underline"
                    >
                      {b.customer_phone}
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                    b.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    b.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {b.status === 'confirmed' ? 'Confirmed' :
                     b.status === 'pending' ? 'Waiting' :
                     b.status === 'completed' ? 'Done' :
                     b.status}
                  </span>

                  {b.status !== 'completed' && (
                    <button
                      onClick={() => updateStatus(b.id, 'completed')}
                      className="text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 px-3 py-1.5 rounded-lg transition"
                    >
                      End
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}