import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import AuthLayout from '../../components/AuthLayout';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('loading'); 
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('Token missing');
      return;
    }

    api.post('/auth/verify', { token })
      .then(() => {
        setStatus('success');
        setTimeout(() => navigate('/login?verified=success'), 2500);
      })
      .catch((err) => {
        setStatus('error');
        setError(err.response?.data?.error || 'Verification failed');
      });
  }, [token, navigate]);

  if (status === 'loading') {
    return (
      <AuthLayout
        title="Verifying"
        subtitle="Please wait"
      >
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-5 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      </AuthLayout>
    );
  }

  if (status === 'success') {
    return (
      <AuthLayout
        title="Email verified"
        subtitle="Your account is active"
      >
        <div className="text-center py-6">
          <div className="w-20 h-20 mx-auto mb-5 bg-emerald-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Welcome to  BookWise!
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            Redirecting to login...
          </p>
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
      title="Verification failed"
      subtitle="Token expired"
    >
      <div className="text-center py-6">
        <div className="w-20 h-20 mx-auto mb-5 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <p className="text-sm text-red-700 mb-6">{error}</p>
        <Link
          to="/register"
          className="inline-block px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
        >
          Register again
        </Link>
      </div>
    </AuthLayout>
  );
}