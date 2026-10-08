import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useCompany } from '../../contexts/CompanyContext';

export default function Users() {
  const { activeCompany } = useCompany();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteData, setInviteData] = useState({ email: '', role: 'staff' });
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');

  const loadMembers = async () => {
    if (!activeCompany) return;
    setLoading(true);
    try {
      const r = await api.get(`/companies/${activeCompany.id}/members`);
      setMembers(r.data.data || []);
    } catch (err) {
      console.error('Load members error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [activeCompany]);

  const handleInvite = async (e) => {
    e.preventDefault();
    setError('');
    setInviting(true);

    try {
      await api.post(`/companies/${activeCompany.id}/invite`, {
        email: inviteData.email,
        role: inviteData.role,
      });
      setShowInviteModal(false);
      setInviteData({ email: '', role: 'staff' });
      await loadMembers();
    } catch (err) {
      setError(err.response?.data?.error || 'Invite failed');
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/companies/${activeCompany.id}/members/${userId}/role`, {
        role: newRole,
      });
      await loadMembers();
    } catch (err) {
      alert(err.response?.data?.error || 'Role update failed');
    }
  };

  const handleRemove = async (member) => {
    if (!confirm(`Remove "${member.name}" from the company?`)) return;

    try {
      await api.delete(`/companies/${activeCompany.id}/members/${member.id || member.user_id}`);
      await loadMembers();
    } catch (err) {
      alert(err.response?.data?.error || 'Remove failed');
    }
  };

  const filtered = members.filter((m) => {
    if (filterRole && m.role !== filterRole) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        m.name?.toLowerCase().includes(s) ||
        m.email?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  if (!activeCompany) {
    return (
      <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-12 text-center">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          Choose a company
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          You must have an active company
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Users
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {activeCompany.name} · {filtered.length} of {members.length} users
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition"
        >
          + Invite User
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="flex-1 min-w-[200px] px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-lg text-sm focus:border-indigo-500 outline-none"
        />

        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-lg text-sm focus:border-indigo-500 outline-none"
        >
          <option value="">All roles</option>
          <option value="owner">Owner</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="staff">Staff</option>
        </select>

        {(search || filterRole) && (
          <button
            onClick={() => {
              setSearch('');
              setFilterRole('');
            }}
            className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-500 dark:text-slate-400">
          Loading users...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-12 text-center">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
            No users found
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {members.length === 0 ? 'Invite your first user' : 'Try changing your search or filter'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                    User
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                    Role
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                    Joined
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((m) => (
                  <tr
                    key={m.id || m.user_id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                          {m.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">
                            {m.name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {m.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {m.role === 'owner' ? (
                        <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full">
                          Owner
                        </span>
                      ) : (
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.id || m.user_id, e.target.value)}
                          className="text-xs border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded px-2 py-1 focus:border-indigo-500 outline-none capitalize"
                        >
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="staff">Staff</option>
                        </select>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">
                      {m.joined_at
                        ? new Date(m.joined_at).toLocaleDateString('en-GB')
                        : m.created_at
                        ? new Date(m.created_at).toLocaleDateString('en-GB')
                        : '—'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {m.role !== 'owner' && (
                        <button
                          onClick={() => handleRemove(m)}
                          className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setShowInviteModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Invite User
              </h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xl leading-none"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Email *
                </label>
                <input
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                  required
                  placeholder="name@company.com"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg text-sm focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Role *
                </label>
                <select
                  value={inviteData.role}
                  onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg text-sm focus:border-indigo-500 outline-none"
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="staff">Staff</option>
                </select>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                An invitation email will be sent to this address.
              </p>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
                >
                  {inviting ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}