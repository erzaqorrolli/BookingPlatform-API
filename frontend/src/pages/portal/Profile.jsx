import { useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '' });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await api.post('/auth/change-password', pwForm);
      setSuccess('Password changed successfully');
      setPwForm({ current_password: '', new_password: '' });
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Change failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-2xl space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">My profile</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage profile
        </p>
      </div>

      {/* User info */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-2xl font-bold text-white sm:h-16 sm:w-16">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="break-words text-lg font-semibold text-slate-900">{user?.name}</div>
            <div className="break-all text-sm text-slate-500">{user?.email}</div>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-5">
          Change password
        </h2>

        {success && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-sm text-emerald-700">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Actual password
            </label>
            <input
              type="password"
              value={pwForm.current_password}
              onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
              required
              className="w-full min-w-0 rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
            New password (minimum 6 charachters)
            </label>
            <input
              type="password"
              value={pwForm.new_password}
              onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
              required
              minLength={6}
              className="w-full min-w-0 rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-emerald-500 outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="min-h-11 w-full rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60 sm:w-auto"
            >
              {saving ? 'Changing...' : 'Change password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}