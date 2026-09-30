import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AuthLayout from '../../components/AuthLayout';

export default function Login() {
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

    if (role === 'owner' || role === 'admin' || role === 'manager') {
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
      title="Welcome Back"
      subtitle="Log into your account"
    >
      {error && (
        <div className="mb-5 flex items-start gap-2 rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#506078]">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="name@company.com"
            className="w-full rounded-lg border border-[#dfe5ee] bg-[#fbfcfe] px-4 py-3 text-sm text-[#172033] outline-none transition placeholder:text-[#a3afbf] focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-[#506078]">
              Password
            </label>
            <Link to="/forgot" className="text-xs text-indigo-600 hover:text-indigo-700">
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
              className="w-full rounded-lg border border-[#dfe5ee] bg-[#fbfcfe] px-4 py-3 pr-16 text-sm text-[#172033] outline-none transition placeholder:text-[#a3afbf] focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#71809a] hover:text-teal-700"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#10213b] py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#10213b]/15 transition hover:-translate-y-0.5 hover:bg-[#19395a] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Loading' : 'Log into your account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#71809a]">
        Don't have an account?{' '}
        <Link to="/register" className="font-semibold text-teal-700 hover:text-teal-800">
          Register
        </Link>
      </p>
    </AuthLayout>
  );
}