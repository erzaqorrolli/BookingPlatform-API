import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

const SOCKET_URL = 'http://localhost:3001';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const socketRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const load = useCallback(async () => {
    if (!user?.id) return;

    try {
      const r = await api.get('/me/notifications');
      setNotifications(r.data.data?.notifications || []);
      setUnreadCount(r.data.data?.unread_count || 0);
    } catch (err) {
      console.error(err);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log(' WS connected:', socket.id);
      socket.emit('join', user.id);
    });

    socket.on('notification', (data) => {
      console.log('New notification:', data);
      load(); 
    });

    socket.on('disconnect', () => {
      console.log(' WS disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, [load, user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const initialLoad = setTimeout(load, 0);
    const interval = setInterval(load, 60000);
    return () => {
      clearTimeout(initialLoad);
      clearInterval(interval);
    };
  }, [load, user?.id]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (n) => {
    if (!n.read_at) {
      await markAsRead(n.id);
    }
    setOpen(false);
    if (n.link) {
      navigate(n.link);
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const d = new Date(date);
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const recent = notifications.slice(0, 8);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
      >
        <svg className="w-6 h-6 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-indigo-600 hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          {recent.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">
              No notifications
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {recent.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition ${
                    !n.read_at ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read_at && (
                      <span className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {n.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {formatTime(n.created_at)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <Link
            to="/admin/notifications"
            onClick={() => setOpen(false)}
            className="block text-center px-4 py-3 text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 border-t border-slate-100 dark:border-slate-700"
          >
            View all
          </Link>
        </div>
      )}
    </div>
  );
}