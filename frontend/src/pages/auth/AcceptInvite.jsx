import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import AuthLayout from '../../components/AuthLayout';

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const token = searchParams.get('token');
  const [invite, setInvite] = useState(null);
  const [form, setForm] = useState({ name: '', password: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return undefined;

    api.get(`/invitations/${token}`)
      .then((response) => setInvite(response.data.data))
      .catch((err) => setError(err.response?.data?.error || 'Invalid or expired invitation'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await api.post('/auth/register-invited', { token, ...form });
      await login(invite.email, form.password);
      navigate('/staff', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create the staff account');
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return <AuthLayout title="Invitation unavailable" subtitle="This invitation cannot be used"><div className="py-6 text-center text-sm text-red-700">Invitation token is missing</div></AuthLayout>;
  }

  if (loading) {
    return <AuthLayout title="Loading invitation" subtitle="Please wait"><div className="py-8 text-center text-slate-500">Loading...</div></AuthLayout>;
  }

  if (!invite) {
    return <AuthLayout title="Invitation unavailable" subtitle="This invitation cannot be used"><div className="py-6 text-center text-sm text-red-700">{error}</div></AuthLayout>;
  }

  return (
    <AuthLayout title="Join the team" subtitle={`Create your staff account for ${invite.company_name}`}>
      {error && <div className="mb-5 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="mb-5 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
        <div><strong>Email:</strong> {invite.email}</div>
        <div><strong>Role:</strong> {invite.role_name}</div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Full name</label>
          <input type="text" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
          <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required minLength={6} className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500" />
        </div>
        <button type="submit" disabled={submitting} className="w-full rounded-lg bg-indigo-600 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60">
          {submitting ? 'Creating account...' : 'Accept invitation'}
        </button>
      </form>
    </AuthLayout>
  );
}
