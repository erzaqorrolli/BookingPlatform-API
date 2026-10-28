import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useCompany } from '../../contexts/CompanyContext';
import { usePermissions } from '../../contexts/PermissionsContext';
import ManualBookingModal from '../../components/ManualBookingModal';

const STATUS_LABELS = {
  pending: 'Waiting',
  confirmed: 'Confirmed',
  completed: 'Done',
  cancelled: 'Cancelled',
  no_show: 'Absent',
};

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-slate-100 text-slate-700',
};

export default function StaffBookings() {
  const { activeCompany } = useCompany();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const { hasPermission } = usePermissions(); 
  const canManage = hasPermission('staff_can_manage_bookings'); 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [services, setServices] = useState([]);

  const load = async () => {
    if (!activeCompany) return;
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterDate) params.date = filterDate;

      const r = await api.get(`/companies/${activeCompany.id}/bookings`, { params });
      setBookings(r.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [activeCompany, filterStatus, filterDate]);

  useEffect(() => {
    if (activeCompany?.id) {
        api.get(`/companies/${activeCompany.id}/services`)
           .then(res => setServices(res.data.data || res.data))
           .catch(err => console.error("Error fetching services:", err));
    }
  }, [activeCompany?.id]);

  const updateStatus = async (bookingId, newStatus) => {
    try {
      await api.put(
        `/companies/${activeCompany.id}/bookings/${bookingId}/status`,
        { status: newStatus }
      );
      await load();
    } catch (err) {
      alert(err.response?.data?.error || 'Change failed');
    }
  };

  const handleClaim = async (bookingId) => {
    try {
      await api.post(`/companies/${activeCompany.id}/bookings/${bookingId}/claim`);
      await load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to claim booking');
    }
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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bookings</h1>
          <p className="text-sm text-slate-500 mt-1">
            {activeCompany.name} · {bookings.length} bookings
          </p>
        </div>
        
        {/* Butoni për manual booking */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition flex items-center gap-2 text-sm font-semibold shadow-sm"
        >
          + Add Booking
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-orange-500 outline-none"
        >
          <option value="">All status</option>
          <option value="pending">Waiting</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Done</option>
          <option value="cancelled">Cancel</option>
        </select>

        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-orange-500 outline-none"
        />

        {(filterStatus || filterDate) && (
          <button
            onClick={() => {
              setFilterStatus('');
              setFilterDate('');
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
      ) : bookings.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
          <h3 className="font-semibold text-slate-900 mb-1">No bookings</h3>
          <p className="text-sm text-slate-500">Try another filters</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Reference</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Client</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Service</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Time</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Staff</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 text-sm font-mono text-slate-500">
                      {b.reference || `#${b.id}`}
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm font-medium text-slate-900">{b.customer_name}</div>
                      <div className="text-xs text-slate-500">{b.customer_email}</div>
                      {b.customer_phone && (
                        <div className="text-xs text-slate-400">{b.customer_phone}</div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">{b.service_name}</td>
                    <td className="px-5 py-4 text-sm text-slate-700">
                      {new Date(b.booking_date).toLocaleDateString('sq-AL')}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">
                      {b.start_time?.slice(0, 5)} - {b.end_time?.slice(0, 5)}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[b.status]}`}>
                        {STATUS_LABELS[b.status]}
                      </span>
                    </td>
                    
                    <td className="px-5 py-4">
                      {b.staff_name ? (
                        <span className="text-sm font-medium text-slate-900">
                          {b.staff_name}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      {canManage ? (
                        <div className="flex items-center justify-end gap-2">
                          {!b.staff_name && (
                            <button
                              onClick={() => handleClaim(b.id)}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition"
                            >
                              Accept
                            </button>
                          )}
                          
                          <select
                            value={b.status}
                            onChange={(e) => updateStatus(b.id, e.target.value)}
                            className="text-xs border border-slate-200 rounded px-2 py-1 focus:border-orange-500 outline-none"
                          >
                            <option value="pending">Waiting</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Done</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="no_show">Absent</option>
                          </select>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">View only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Booking Modal */}
      {isModalOpen && (
        <ManualBookingModal 
            companyId={activeCompany.id} 
            services={services} 
            onClose={() => setIsModalOpen(false)} 
            onSuccess={() => load()} 
        />
      )}
    </div>
  );
}