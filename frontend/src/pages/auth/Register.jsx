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
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <svg className="h-8 w-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-white">
            Registration complete!
          </h3>
          <p className="mb-6 text-sm leading-relaxed text-white/50">
            Your account is ready. You can now sign in with{' '}
            <strong className="text-white">{form.email}</strong>
          </p>
          <Link
            to="/login"
            className="inline-block px-5 py-2.5 bg-white text-black text-sm font-semibold rounded-lg hover:bg-white/90 transition"
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
        <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-white/60 mb-1.5">
            Full Name
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            placeholder="Name LastName"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:border-indigo-400 focus:bg-white/10 outline-none transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-white/60 mb-1.5">
            Email
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
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
              placeholder="Min. 6 characters"
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

        <div className="flex items-start">
          <input
            id="terms"
            type="checkbox"
            required
            className="w-4 h-4 mt-0.5 text-indigo-500 bg-white/5 border-white/20 rounded focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
          />
          <label htmlFor="terms" className="ml-2 cursor-pointer text-xs leading-5 text-white/50">
            Agree <a href="#" className="font-semibold text-indigo-400 hover:text-indigo-300">Terms</a> and{' '}
            <a href="#" className="font-semibold text-indigo-400 hover:text-indigo-300">Policy</a>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition disabled:opacity-60 shadow-[0_0_40px_rgba(255,255,255,0.2)]"
        >
          {loading ? 'Almost done...' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-white/50">
        Have an account?{' '}
        <Link to="/login" className="font-medium text-indigo-400 hover:text-indigo-300 transition">
          Login here
        </Link>
      </p>
    </AuthLayout>
  );
}