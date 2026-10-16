import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import Swal from 'sweetalert2';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  const load = async () => {
    try {
      const r = await api.get('/me/notifications');
      setNotifications(r.data.data?.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.post(`/me/notifications/${id}/read`);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/me/notifications/read-all');
      load();
      Swal.fire({
        icon: 'success',
        title: 'All marked as read',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete notification?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#dc2626',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/me/notifications/${id}`);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClick = async (n) => {
    if (!n.read_at) {
      await markAsRead(n.id);
    }
    if (n.link) {
      navigate(n.link);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read_at;
    if (filter === 'read') return n.read_at;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">
            {unreadCount} unread · {notifications.length} total
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 border-b border-slate-200">
        {[
          { key: 'all', label: `All (${notifications.length})` },
          { key: 'unread', label: `Unread (${unreadCount})` },
          { key: 'read', label: `Read (${notifications.length - unreadCount})` },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              filter === f.key
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
          <div className="text-5xl mb-3">🔔</div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            No notifications
          </h3>
          <p className="text-sm text-slate-500">
            You're all caught up!
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
          {filtered.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-4 p-5 transition ${
                !n.read_at ? 'bg-indigo-50/50' : 'hover:bg-slate-50'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  n.type === 'booking'
                    ? 'bg-indigo-100 text-indigo-600'
                    : n.type === 'invoice'
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {n.type === 'booking' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ) : n.type === 'invoice' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {n.title}
                      {!n.read_at && (
                        <span className="ml-2 inline-block w-2 h-2 bg-indigo-500 rounded-full" />
                      )}
                    </p>
                    <p className="text-sm text-slate-600 mt-1">{n.message}</p>
                    <p className="text-xs text-slate-400 mt-2">
                      {formatDate(n.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!n.read_at && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="text-xs font-medium text-indigo-600 hover:underline"
                      >
                        Mark read
                      </button>
                    )}
                    {n.link && (
                      <button
                        onClick={() => handleClick(n)}
                        className="text-xs font-medium text-slate-600 hover:underline"
                      >
                        View
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(n.id)}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}