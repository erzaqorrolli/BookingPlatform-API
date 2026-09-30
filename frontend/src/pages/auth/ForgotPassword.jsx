import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import AuthLayout from '../../components/AuthLayout';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [debugToken, setDebugToken] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const r = await api.post('/auth/forgot', { email });
      setSent(true);
      if (r.data.data?.debug_token) {
        setDebugToken(r.data.data.debug_token);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="If email doesn't exists, you will recieve a reset link"
      >
        <div className="text-center py-6">
          <div className="w-16 h-16 mx-auto mb-5 bg-emerald-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Link sent!
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            Check <strong className="text-slate-700">{email}</strong> for instructions
          </p>

          {debugToken && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-800 text-left mb-5">
              <strong>Dev mode:</strong> reset link:
              <br />
              <Link
                to={`/reset?token=${debugToken}`}
                className="text-amber-900 underline break-all"
              >
                /reset?token={debugToken.substring(0, 20)}...
              </Link>
            </div>
          )}

          <Link
            to="/login"
            className="inline-block px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
          >
            Back to login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot password?"
      subtitle="You will recieve your link through email"
    >
      {error && (
        <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="name@company.com"
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition disabled:opacity-60"
        >
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Remember password?{' '}
        <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
          Back to login
        </Link>
      </p>
    </AuthLayout>
  );
}