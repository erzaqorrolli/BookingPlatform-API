import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AuthLayout from '../../components/AuthLayout';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(form.name, form.email, form.password);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Register failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout title="Account created" subtitle="You have been registered successfully">
          <div className="py-6 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
            <svg className="h-8 w-8 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-[#172033]">
            Register is done!
          </h3>
          <p className="mb-6 text-sm leading-relaxed text-[#71809a]">
            Your account is ready. You can now sign in with{' '}
            <strong className="text-[#172033]">{form.email}</strong>
          </p>
          <Link
            to="/login"
            className="inline-block rounded-lg bg-[#10213b] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#19395a]"
          >
            Go to login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create new account"
      subtitle="Start for free"
    >
      {error && (
        <div className="mb-5 rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#506078]">
            Full Name
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            placeholder="Name LastName"
            className="w-full rounded-lg border border-[#dfe5ee] bg-[#fbfcfe] px-4 py-3 text-sm text-[#172033] outline-none transition placeholder:text-[#a3afbf] focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#506078]">
            Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            placeholder="emri@kompania.com"
            className="w-full rounded-lg border border-[#dfe5ee] bg-[#fbfcfe] px-4 py-3 text-sm text-[#172033] outline-none transition placeholder:text-[#a3afbf] focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#506078]">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
              placeholder="Min. 6 karaktere"
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

        <div className="flex items-start">
          <input
            id="terms"
            type="checkbox"
            required
            className="w-4 h-4 mt-0.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
          />
          <label htmlFor="terms" className="ml-2 cursor-pointer text-xs leading-5 text-[#71809a]">
            Agree <a href="#" className="font-semibold text-teal-700 hover:underline">Terms</a> and{' '}
            <a href="#" className="font-semibold text-teal-700 hover:underline">Policy</a>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#10213b] py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#10213b]/15 transition hover:-translate-y-0.5 hover:bg-[#19395a] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Almost done' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#71809a]">
        Have an account?{' '}
        <Link to="/login" className="font-semibold text-teal-700 hover:text-teal-800">
          Login here
        </Link>
      </p>
    </AuthLayout>
  );
}