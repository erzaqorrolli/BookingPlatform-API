import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useCompany } from '../../contexts/CompanyContext';

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-slate-100 text-slate-700',
};

const STATUS_LABELS = {
  pending: 'Waiting',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'Not attended',
};

export default function Bookings() {
  const { activeCompany } = useCompany();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const loadBookings = async () => {
    if (!activeCompany) return;
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterDate) params.date = filterDate;

      const r = await api.get(`/companies/${activeCompany.id}/bookings`, { params });
      const list = [...(r.data.data || [])];

      list.sort((a, b) => {
        const aPriority = Number(a.needs_assistance) === 1 && a.status !== 'completed' ? 1 : 0;
        const bPriority = Number(b.needs_assistance) === 1 && b.status !== 'completed' ? 1 : 0;
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        return new Date(b.booking_date) - new Date(a.booking_date);
      });

      setBookings(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [activeCompany, filterStatus, filterDate]);

  const updateStatus = async (bookingId, newStatus) => {
    try {
      await api.put(
        `/companies/${activeCompany.id}/bookings/${bookingId}/status`,
        { status: newStatus }
      );
      await loadBookings();
    } catch (err) {
      alert(err.response?.data?.error || 'Change failed');
    }
  };

  if (!activeCompany) {
    return (
      <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Choose a company
        </h3>
        <p className="text-sm text-slate-500">
          You must have an active company
        </p>
      </div>
    );
  }

  const filteredBookings = bookings.filter((b) => {
    if (filterPriority === 'priority') return Number(b.needs_assistance) === 1;
    if (filterPriority === 'normal') return Number(b.needs_assistance) !== 1;
    return true;
  });

  const priorityCount = bookings.filter(
    (b) => Number(b.needs_assistance) === 1 && b.status !== 'completed'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bookings</h1>
          <p className="text-sm text-slate-500 mt-1">
            {activeCompany.name} · {filteredBookings.length} bookings
          </p>
        </div>
      </div>

      {priorityCount > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-4 flex items-start gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900 mb-1">
              Attention: {priorityCount} priority booking{priorityCount > 1 ? 's' : ''}
            </h3>
            <p className="text-sm text-amber-800 leading-relaxed">
              Clients with the <strong>⚠️ Priority</strong> badge have <strong>special needs</strong>{' '}
              (disabilities, specific requirements, etc.). Please handle these bookings with{' '}
              <strong>higher priority</strong> and make sure their requests are fulfilled.
            </p>
            <button
              onClick={() => setFilterPriority('priority')}
              className="mt-2 text-sm font-medium text-amber-700 hover:text-amber-900 underline"
            >
              Show only these bookings →
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
        >
          <option value="">All statuses</option>
          <option value="pending">Waiting</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no_show">Not attended</option>
        </select>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
        >
          <option value="">All clients</option>
          <option value="priority">Priority</option>
          <option value="normal">Regular</option>
        </select>

        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
        />

        {(filterStatus || filterDate || filterPriority) && (
          <button
            onClick={() => {
              setFilterStatus('');
              setFilterDate('');
              setFilterPriority('');
            }}
            className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900"
          >
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          Loading...
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            No bookings
          </h3>
          <p className="text-sm text-slate-500">
            Bookings will show here, when clients book online
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reference Id</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Client</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Service</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Time</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings.map((b) => {
                const isPriority = Number(b.needs_assistance) === 1 && b.status !== 'completed';
                return (
                  <tr
                    key={b.id}
                    className={`transition ${
                      isPriority
                        ? 'bg-amber-50 hover:bg-amber-100 border-l-4 border-amber-500'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div className="text-sm font-mono font-semibold text-indigo-600">
                        {b.reference || `#${b.id}`}
                      </div>
                      {isPriority && (
                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-xs font-semibold bg-amber-200 text-amber-900 rounded-full">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Priority
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-sm font-medium text-slate-900">{b.customer_name}</div>
                      <div className="text-xs text-slate-500">{b.customer_email}</div>
                      {b.customer_phone && (
                        <div className="text-xs text-slate-400">{b.customer_phone}</div>
                      )}
                      {isPriority && b.assistance_notes && (
                        <div className="mt-1.5 text-xs text-amber-800 bg-amber-100 px-2 py-1 rounded border border-amber-200">
                          <strong>Request:</strong> {b.assistance_notes}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-700">{b.service_name}</td>
                    <td className="px-5 py-4 text-sm text-slate-700">
                      {new Date(b.booking_date).toLocaleDateString('sq-AL')}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">
                      {b.start_time?.slice(0, 5)} - {b.end_time?.slice(0, 5)}
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-slate-900">
                      €{parseFloat(b.total_price).toFixed(2)}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[b.status]}`}>
                        {STATUS_LABELS[b.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <select
                        value={b.status}
                        onChange={(e) => updateStatus(b.id, e.target.value)}
                        className="text-xs border border-slate-200 rounded px-2 py-1 focus:border-indigo-500 outline-none"
                      >
                        <option value="pending">Waiting</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="no_show">Not attended</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}