import { useState, useEffect } from 'react';
import api from '../../../api/client';

const STATUS_COLORS = {
  new: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
  read: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
  replied: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  archived: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
};

export default function ContactMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;

      const r = await api.get('/superadmin/contact-messages', { params });
      setMessages(r.data.data || []);
    } catch (err) {
      console.error('Load messages error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [search, filterStatus]);

  const handleOpenMessage = async (message) => {
    setSelectedMessage(message);
    setShowModal(true);

    // Mark as read nëse është new
    if (message.status === 'new') {
      try {
        await api.put(`/superadmin/contact-messages/${message.id}/read`);
        await loadMessages();
      } catch (err) {
        console.error('Mark read error:', err);
      }
    }
  };

  const handleDelete = async (message) => {
    if (!confirm(`Delete message from "${message.name}"?`)) return;

    try {
      await api.delete(`/superadmin/contact-messages/${message.id}`);
      setShowModal(false);
      setSelectedMessage(null);
      await loadMessages();
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed');
    }
  };

  const newCount = messages.filter((m) => m.status === 'new').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Contact Messages
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {messages.length} messages
            {newCount > 0 && (
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full">
                {newCount} new
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, subject..."
          className="flex-1 min-w-[200px] px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-lg text-sm focus:border-indigo-500 outline-none"
        />

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-lg text-sm focus:border-indigo-500 outline-none"
        >
          <option value="">All statuses</option>
          <option value="new">New</option>
          <option value="read">Read</option>
          <option value="replied">Replied</option>
          <option value="archived">Archived</option>
        </select>

        {(search || filterStatus) && (
          <button
            onClick={() => {
              setSearch('');
              setFilterStatus('');
            }}
            className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      {/* Messages List */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-500 dark:text-slate-400">
          Loading messages...
        </div>
      ) : messages.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
            No messages
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Messages from the contact form will appear here
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {messages.map((m) => (
              <button
                key={m.id}
                onClick={() => handleOpenMessage(m)}
                className={`w-full text-left px-5 py-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                  m.status === 'new' ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {m.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {m.name}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[m.status] || 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                        {m.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      {m.email}
                    </div>
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                      {m.subject}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">
                      {m.message?.substring(0, 100)}
                      {m.message?.length > 100 ? '...' : ''}
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 flex-shrink-0">
                    {new Date(m.created_at).toLocaleDateString('en-GB')}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showModal && selectedMessage && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-semibold">
                  {selectedMessage.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {selectedMessage.name}
                  </h2>
                  <a
                    href={`mailto:${selectedMessage.email}`}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {selectedMessage.email}
                  </a>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xl leading-none"
              >
                ✕
              </button>
            </div>

            {/* Subject */}
            <div className="mb-4">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                Subject
              </div>
              <div className="text-base font-medium text-slate-900 dark:text-white">
                {selectedMessage.subject}
              </div>
            </div>

            {/* Message */}
            <div className="mb-4">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                Message
              </div>
              <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                {selectedMessage.message}
              </div>
            </div>

            {/* Meta */}
            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-6 flex-wrap">
              <span>
                <strong>Status:</strong> <span className="capitalize">{selectedMessage.status}</span>
              </span>
              <span>•</span>
              <span>
                <strong>Received:</strong>{' '}
                {new Date(selectedMessage.created_at).toLocaleString('en-GB')}
              </span>
              {selectedMessage.read_at && (
                <>
                  <span>•</span>
                  <span>
                    <strong>Read:</strong>{' '}
                    {new Date(selectedMessage.read_at).toLocaleString('en-GB')}
                  </span>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              <a
                href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject)}`}
                className="flex-1 min-w-[140px] px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium text-center transition"
              >
                Reply via Email
              </a>
              <button
                onClick={() => handleDelete(selectedMessage)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition"
              >
                Delete
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}