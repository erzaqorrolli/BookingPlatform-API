import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import AuthLayout from '../../components/AuthLayout';

export default function RegisterBusiness() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    company_name: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Regjistro biznesin
      const r = await api.post('/auth/register-business', form);
      const data = r.data.data;

      // 2. Verifiko email-in (dev mode)
      if (data.debug_token) {
        await api.post('/auth/verify', { token: data.debug_token });
      }

      // 3. Login automatik
      const loginRes = await api.post('/auth/login', {
        email: form.email,
        password: form.password,
      });

      const token = loginRes.data.data.token;
      sessionStorage.setItem('token', token);

      // 4. Redirect në admin
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Register failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Register your business"
      subtitle="Start for free – receive online bookings in just 2 minutes"
    >
      {error && (
        <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-white/60 mb-1.5">
            Full name *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            placeholder="Filan Fisteku"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:border-indigo-400 focus:bg-white/10 outline-none transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-white/60 mb-1.5">
            Company name *
          </label>
          <input
            type="text"
            value={form.company_name}
            onChange={(e) => setForm({ ...form, company_name: e.target.value })}
            required
            placeholder="Barber Shop Prishtina"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:border-indigo-400 focus:bg-white/10 outline-none transition"
          />
          <p className="text-xs text-white/40 mt-1.5">
            This name will be shown when clients book.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-white/60 mb-1.5">
            Email *
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            placeholder="emri@kompania.com"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:border-indigo-400 focus:bg-white/10 outline-none transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-white/60 mb-1.5">
            Password *
          </label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={6}
            placeholder="Minimum 6 characters"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:border-indigo-400 focus:bg-white/10 outline-none transition"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition disabled:opacity-60 shadow-[0_0_40px_rgba(255,255,255,0.2)]"
        >
          {loading ? 'Registering...' : 'Create business account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-white/50">
        Have an account?{' '}
        <Link to="/login" className="font-medium text-indigo-400 hover:text-indigo-300 transition">
          Login
        </Link>
      </p>

      <div className="mt-4 pt-4 border-t border-white/10 text-center">
        <p className="text-sm text-white/50">
          Are you a client?{' '}
          <Link to="/register" className="font-medium text-emerald-400 hover:text-emerald-300 transition">
            Register as a client
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}