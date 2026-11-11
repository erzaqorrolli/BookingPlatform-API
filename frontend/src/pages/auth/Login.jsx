import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import AuthLayout from '../../components/AuthLayout';

export default function Login() {
  const { settings } = useSettings();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userData = await login(email, password);
      const user = userData?.user || userData || {};
      const companies = user?.companies || userData?.companies || [];
      const role = user?.role || userData?.role || companies.find((company) => company?.role && !['customer'].includes(company.role))?.role || companies[0]?.role || 'customer';

      if (role === 'superadmin') {
        navigate('/admin/superadmin');
      } else if (role === 'owner' || role === 'admin' || role === 'manager') {
        navigate('/admin');
      } else if (role === 'staff') {
        navigate('/staff');
      } else {
        navigate('/portal');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={`Welcome back`}
      subtitle={`Log into your ${settings.platform_name} account`}
    >
      {error && (
        <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-white/60 mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="name@company.com"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:border-indigo-400 focus:bg-white/10 outline-none transition"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-white/60">
              Password
            </label>
            <Link to="/forgot" className="text-xs text-indigo-400 hover:text-indigo-300 transition">
              Forgot?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 pr-16 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:border-indigo-400 focus:bg-white/10 outline-none transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-white/40 hover:text-white/70 transition"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition disabled:opacity-60 shadow-[0_0_40px_rgba(255,255,255,0.2)]"
        >
          {loading ? 'Loading...' : 'Log into your account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-white/50">
        Don't have an account?{' '}
        <Link to="/register" className="font-medium text-indigo-400 hover:text-indigo-300 transition">
          Register
        </Link>
      </p>
    </AuthLayout>
  );
}