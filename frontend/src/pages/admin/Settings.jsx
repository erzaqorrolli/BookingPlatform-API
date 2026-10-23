import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useCompany } from '../../contexts/CompanyContext';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmModal from '../../components/ConfirmModal'; 
import toast from 'react-hot-toast';

export default function Settings() {
  const { activeCompany, refreshCompanies } = useCompany();
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', timezone: 'Europe/Berlin',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');

  const [smtpForm, setSmtpForm] = useState({
    smtp_host: '', smtp_port: '587', smtp_user: '', smtp_pass: '', smtp_encryption: 'tls', from_email: '', from_name: ''
  });
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);

  // States për Rolet e Reja
  const [customRoles, setCustomRoles] = useState([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [isCreatingRole, setIsCreatingRole] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (!activeCompany) return;
    setForm({
      name: activeCompany.name || '',
      email: activeCompany.email || '',
      phone: activeCompany.phone || '',
      address: activeCompany.address || '',
      timezone: activeCompany.timezone || 'Europe/Berlin',
    });
    loadRoles();
  }, [activeCompany]);

  const loadRoles = async () => {
    if (!activeCompany) return;
    try {
      const res = await api.get(`/companies/${activeCompany.id}/custom-roles`);
      setCustomRoles(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    setIsCreatingRole(true);
    try {
      await api.post(`/companies/${activeCompany.id}/custom-roles`, { name: newRoleName });
      setNewRoleName('');
      await loadRoles();
      toast.success('Roli u krijua!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Dështoi krijimi i rolit');
    } finally {
      setIsCreatingRole(false);
    }
  };

  const toggleRolePermission = async (roleId, permissionKey, currentPermissions) => {
    let newPerms;
    if (currentPermissions.includes(permissionKey)) {
      newPerms = currentPermissions.filter(p => p !== permissionKey);
    } else {
      newPerms = [...currentPermissions, permissionKey];
    }
    
    try {
      await api.post(`/companies/${activeCompany.id}/custom-roles/${roleId}/permissions`, { permissions: newPerms });
      await loadRoles();
      toast.success('Leja u përditësua');
    } catch (err) {
      toast.error('Dështoi përditësimi');
    }
  };

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    setSaving(true);
    try {
      await api.put(`/companies/${activeCompany.id}`, form);
      await refreshCompanies();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Saving failed');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSmtp = async (e) => {
    e.preventDefault();
    setSmtpSaving(true);
    const toastId = toast.loading('Saving SMTP settings...');
    try {
      await api.put(`/companies/${activeCompany.id}/smtp-settings`, smtpForm);
      toast.success('SMTP settings saved!', { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save SMTP', { id: toastId });
    } finally {
      setSmtpSaving(false);
    }
  };

  const handleTestEmail = async () => {
    const emailTo = prompt("Shkruaj email-in tënd për të marrë testin (p.sh. emailiyt@gmail.com):");
    if (!emailTo) return;

    setTestingEmail(true);
    const toastId = toast.loading('Duke dërguar email test...');
    
    try {
      await api.post(`/companies/${activeCompany.id}/test-smtp`, { email_to: emailTo });
      toast.success('Email test is sent! Check inbox.', { id: toastId });
    } catch (err) {
      console.error("Error from server:", err.response?.data);
      toast.error(err.response?.data?.error || 'Dërgimi dështoi', { id: toastId });
    } finally {
      setTestingEmail(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    setPwSaving(true);
    try {
      await api.post('/auth/change-password', pwForm);
      setPwSuccess('Password changed successfully');
      setPwForm({ current_password: '', new_password: '' });
      setTimeout(() => setPwSuccess(''), 4000);
    } catch (err) {
      setPwError(err.response?.data?.error || 'Change failed');
    } finally {
      setPwSaving(false);
    }
  };

  if (!activeCompany) {
    return (
      <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Choose a company</h3>
        <p className="text-sm text-slate-500">You must have an active company</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage company information
        </p>
      </div>

      {/* Company Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-5">
          Company information
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {saved && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-sm text-emerald-700 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Changes saved
          </div>
        )}

        <form onSubmit={handleSaveCompany} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Company name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Phone
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Address
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Time zone
            </label>
            <select
              value={form.timezone}
              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
            >
              <option value="Europe/Berlin">Europe/Berlin</option>
              <option value="Europe/Tirane">Europe/Tirane</option>
              <option value="Europe/Belgrade">Europe/Belgrade</option>
              <option value="UTC">UTC</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>

      {/* SMTP Settings */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-2">
          Email Settings (SMTP)
        </h2>
        <p className="text-sm text-slate-500 mb-5">
          Configure your email account to send client messages from the platform and receive replies in Chat. For Gmail, enable IMAP and use an app password.
        </p>

        <form onSubmit={handleSaveSmtp} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                SMTP Host
              </label>
              <input
                type="text"
                value={smtpForm.smtp_host}
                onChange={(e) => setSmtpForm({ ...smtpForm, smtp_host: e.target.value })}
                placeholder="smtp.gmail.com"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Port
              </label>
              <input
                type="text"
                value={smtpForm.smtp_port}
                onChange={(e) => setSmtpForm({ ...smtpForm, smtp_port: e.target.value })}
                placeholder="587"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email (User)
              </label>
              <input
                type="email"
                value={smtpForm.smtp_user}
                onChange={(e) => setSmtpForm({ ...smtpForm, smtp_user: e.target.value })}
                placeholder="email@company.com"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={smtpForm.smtp_pass}
                onChange={(e) => setSmtpForm({ ...smtpForm, smtp_pass: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center gap-4">
            <button
              type="submit"
              disabled={smtpSaving}
              className="px-5 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-medium text-sm disabled:opacity-60"
            >
              {smtpSaving ? 'Saving SMTP...' : 'Save SMTP Settings'}
            </button>
            
            <button
              type="button"
              onClick={handleTestEmail}
              disabled={testingEmail}
              className="px-4 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-medium text-sm transition border border-indigo-100 disabled:opacity-60"
            >
              {testingEmail ? 'Sending...' : 'Send Test Email'}
            </button>
          </div>
        </form>
      </div>

      {/* KJO ËSHTË PJESA E RE: Roles & Permissions */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-2">Roles & Permissions</h2>
        <p className="text-sm text-slate-500 mb-5">Krijo role të reja dhe cakto çfarë mund të bëjnë.</p>

        <form onSubmit={handleCreateRole} className="flex gap-3 mb-6">
          <input
            type="text"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            placeholder="Emri i rolit të re (p.sh. Email Manager)"
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={isCreatingRole}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-60"
          >
            {isCreatingRole ? 'Duke krijuar...' : 'Krijo Rol'}
          </button>
        </form>

        <div className="space-y-3">
          {customRoles.map(role => (
            <div key={role.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-900">{role.name}</h3>
                <span className="text-xs text-slate-500">{role.permissions.length} leje</span>
              </div>
              
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={role.permissions.includes('staff_can_send_emails')}
                    onChange={() => toggleRolePermission(role.id, 'staff_can_send_emails', role.permissions)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  Dërgo Email-e klientëve
                </label>
              </div>
            </div>
          ))}
          {customRoles.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-4">Nuk ka role të reja. Krijo një të parë.</p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={async () => {
          const toastId = toast.loading('Syncing emails...');
          try {
            const res = await api.post(`/companies/${activeCompany.id}/sync-inbox`);
            toast.success(res.data.data.message, { id: toastId });
          } catch (err) {
            toast.error(err.response?.data?.error || 'Sync failed', { id: toastId });
          }
        }}
        className="px-4 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-medium text-sm transition border border-emerald-100"
      >
        Sync Inbox Now
      </button>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-5">
          Account
        </h2>

        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-slate-900">{user?.name}</div>
            <div className="text-sm text-slate-500">{user?.email}</div>
          </div>
        </div>

        <h3 className="text-sm font-semibold text-slate-900 mb-3">
          Change password
        </h3>

        {pwSuccess && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-sm text-emerald-700">
            {pwSuccess}
          </div>
        )}

        {pwError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
            {pwError}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Actual password
            </label>
            <input
              type="password"
              value={pwForm.current_password}
              onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
              required
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              New password (minimum 6 characters)
            </label>
            <input
              type="password"
              value={pwForm.new_password}
              onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
              required
              minLength={6}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={pwSaving}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium text-sm disabled:opacity-60"
            >
              {pwSaving ? 'Saving...' : 'Change password'}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl border-2 border-red-100 p-6">
        <h2 className="text-lg font-bold text-red-700 mb-2">Danger Zone</h2>
        <p className="text-sm text-slate-500 mb-4">
          Company deletion is permanent. All data will be deleted! This request will be sent to Superadmin.
        </p>
        <button
          type="button"
          onClick={() => setIsDeleteModalOpen(true)}
          className="px-5 py-2.5 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 font-medium text-sm transition"
        >
          Request Company Deletion
        </button>
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Request for company deletion"
        message={
          <span>
            While clicking "Send Request", you will inform Superadmin that you want to delete company <br/><br/>
            <span className="text-xs text-slate-400">
              The SuperAdmin will review your request and contact you.
            </span>
          </span>
        }
        confirmText="Send Request"
        cancelText="Cancel"
        hideDeleteStyle={true}
        onConfirm={async () => {
          try {
            const res = await api.post(`/companies/${activeCompany.id}/request-deletion`);
            setIsDeleteModalOpen(false);
            toast.success(res.data.data.message || 'Request sent!');
          } catch (err) {
            toast.error(err.response?.data?.error || 'Request failed');
            setIsDeleteModalOpen(false);
          }
        }}
        onCancel={() => setIsDeleteModalOpen(false)}
        isLoading={false}
      />
    </div>
  );
}