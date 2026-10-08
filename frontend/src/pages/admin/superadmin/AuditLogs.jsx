import { useState, useEffect } from 'react';
import api from '../../../api/client';

const ACTION_COLORS = {
  'company.blocked': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  'company.active': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  'company.delete': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  'user.blocked': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  'user.active': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  'user.delete': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');

  useEffect(() => {
    api.get('/superadmin/audit-logs')
      .then((r) => setLogs(r.data.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filtered = logs.filter((log) => {
    if (filterAction && log.action !== filterAction) return false;

    if (search) {
      const s = search.toLowerCase();
      const meta = log.metadata ? JSON.parse(log.metadata) : {};
      return (
        log.user_name?.toLowerCase().includes(s) ||
        log.user_email?.toLowerCase().includes(s) ||
        log.action?.toLowerCase().includes(s) ||
        meta.name?.toLowerCase().includes(s) ||
        meta.reason?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const uniqueActions = [...new Set(logs.map((l) => l.action))];

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 dark:text-slate-400">
        Loading audit logs...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Audit Logs
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {filtered.length} of {logs.length} actions recorded
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by user, action, company..."
          className="flex-1 min-w-[200px] px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-lg text-sm focus:border-indigo-500 outline-none"
        />

        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-lg text-sm focus:border-indigo-500 outline-none"
        >
          <option value="">All actions</option>
          {uniqueActions.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        {(search || filterAction) && (
          <button
            onClick={() => {
              setSearch('');
              setFilterAction('');
            }}
            className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-12 text-center">
          <div className="text-5xl mb-3">📋</div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
            {logs.length === 0 ? 'No activity yet' : 'No matching logs'}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {logs.length === 0
              ? 'Actions will appear here when superadmins manage companies or users'
              : 'Try changing your search or filter'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Time</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">User</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Action</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Target</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((log) => {
                  const meta = log.metadata ? JSON.parse(log.metadata) : {};
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {log.user_name || 'Unknown'}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {log.user_email}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          ACTION_COLORS[log.action] || 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="text-sm text-slate-700 dark:text-slate-300">
                          {log.target_type} <span className="text-slate-400">#{log.target_id}</span>
                        </div>
                        {meta.name && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {meta.name}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">
                        {meta.reason || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}