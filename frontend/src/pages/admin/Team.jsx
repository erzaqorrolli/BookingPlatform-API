import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useCompany } from '../../contexts/CompanyContext';
import { useRole } from '../../hooks/useRole';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';

export default function Team() {
  const { activeCompany } = useCompany();
  const role = useRole();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ email: '', role: 'staff' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // States për Rolet e Reja
  const [customRoles, setCustomRoles] = useState([]);
  const [memberRoles, setMemberRoles] = useState({}); 

  const load = async () => {
    if (!activeCompany) return;
    setLoading(true);
    try {
      const r = await api.get(`/companies/${activeCompany.id}/members`);
      const membersList = r.data.data || [];
      setMembers(membersList);
      
      // Marrim rolet e reja për secilin anëtar
      const rolesMap = {};
      await Promise.all(membersList.map(async (m) => {
        if (m.role !== 'owner') {
          try {
            const res = await api.get(`/companies/${activeCompany.id}/members/${m.id}/custom-role`);
            rolesMap[m.id] = res.data.data.custom_role_id || '';
          } catch (err) {
            rolesMap[m.id] = '';
          }
        }
      }));
      setMemberRoles(rolesMap);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomRoles = async () => {
    if (!activeCompany) return;
    try {
      const res = await api.get(`/companies/${activeCompany.id}/custom-roles`);
      setCustomRoles(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { 
    load(); 
    loadCustomRoles();
  }, [activeCompany]);

  const handleRoleChange = async (userId, newRoleId) => {
    try {
      await api.post(`/companies/${activeCompany.id}/members/${userId}/custom-role`, {
        custom_role_id: newRoleId ? parseInt(newRoleId) : null
      });
      setMemberRoles(prev => ({ ...prev, [userId]: newRoleId }));
      toast.success('Roli u përditësua');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Dështoi përditësimi i rolit');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await api.post(`/companies/${activeCompany.id}/invite`, form);
      setSuccess(`Invite sent to ${form.email}`);
      setShowModal(false);
      setForm({ email: '', role: 'staff' });
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Request failed');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (member) => {
    const result = await Swal.fire({
      title: 'Remove member?',
      html: `Are you sure you want to remove <b>${member.name}</b> from this company?<br/><span class="text-sm text-gray-500">This account will be active for other workspaces</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d97706',
      confirmButtonText: 'Yes, remove',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    try {
      Swal.fire({ title: 'Removing...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      
      await api.delete(`/companies/${activeCompany.id}/members/${member.id}`);
      await load();
      
      Swal.fire({
        icon: 'success',
        title: 'Removed!',
        text: `${member.name} removed from company.`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gabim', text: err.response?.data?.error || 'Action failed' });
    }
  };

  const handleDelete = async (member) => {
    const result = await Swal.fire({
      title: 'Delete member permanently?',
      html: `Are you sure you want to delete <b>${member.name}</b>?<br/><br/><span class="text-sm text-red-600 font-bold">Warning: This action will permanently delete this account from all companies, and can't be back!</span>`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Yes, delete!',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    try {
      Swal.fire({ title: 'Deleting...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      
      await api.delete(`/companies/${activeCompany.id}/members/${member.id}/account`);
      await load();
      
      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: ` Account ${member.name} deleted permanently.`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Deletion failed' });
    }
  };

  const roleBadge = (role) => {
    const colors = {
      owner: 'bg-purple-100 text-purple-700',
      admin: 'bg-indigo-100 text-indigo-700',
      manager: 'bg-blue-100 text-blue-700',
      staff: 'bg-slate-100 text-slate-700',
    };
    return colors[role] || colors.staff;
  };

  if (!activeCompany) {
    return (
      <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Choose company</h3>
        <p className="text-sm text-slate-500">You must have an active company</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team</h1>
          <p className="text-sm text-slate-500 mt-1">
            {activeCompany.name} · {members.length} members
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add member
        </button>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-sm text-emerald-700 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          {success}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          Loading...
        </div>
      ) : members.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">No members</h3>
          <p className="text-sm text-slate-500 mb-5">Add members in the team</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Member</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Role</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Custom Role (Permissions)</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Added</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {m.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="font-medium text-slate-900">{m.name}</div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-700">{m.email}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${roleBadge(m.role)}`}>
                      {m.role}
                    </span>
                  </td>

                  {/* KOLONA E RE PËR CUSTOM ROLE */}
                  <td className="px-5 py-4">
                    {role === 'owner' && m.role !== 'owner' ? (
                      <select
                        value={memberRoles[m.id] || ''}
                        onChange={(e) => handleRoleChange(m.id, e.target.value)}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:border-indigo-500 outline-none bg-white w-full max-w-[150px]"
                      >
                        <option value="">Standard (No Custom Role)</option>
                        {customRoles.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-sm text-slate-500">
                        {customRoles.find(r => r.id === memberRoles[m.id])?.name || 'Standard'}
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-500">
                    {m.created_at ? new Date(m.created_at).toLocaleDateString('sq-AL') : '—'}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {m.role !== 'owner' && m.id !== undefined && (
                      <div className="flex items-center justify-end gap-2">
                        
                        <button
                          onClick={() => handleRemove(m)}
                          className="text-xs font-medium text-amber-600 hover:text-amber-700 px-2 py-1 hover:bg-amber-50 rounded transition"
                          title="Remove form this company"
                        >
                          Remove
                        </button>
                        
                        {role === 'owner' && (
                          <button
                            onClick={() => handleDelete(m)}
                            className="text-xs font-medium text-red-600 hover:text-red-700 px-2 py-1 hover:bg-red-50 rounded transition"
                            title="Delete account permanently"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-5">Add new member</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  placeholder="name@company.com"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
                >
                  <option value="admin">Admin – full control</option>
                  <option value="manager">Manager – manage services</option>
                  <option value="staff">Staff – only bookings</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm disabled:opacity-60"
                >
                  {saving ? 'Sending..' : 'Send request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}