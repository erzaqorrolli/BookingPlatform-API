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
  
  // Nëse është true, shfaqet vetëm Login (pa fushën Full Name)
  const [isLoginMode, setIsLoginMode] = useState(false); 

  useEffect(() => {
    if (!token) return undefined;

    api.get(`/invitations/${token}`)
      .then((response) => {
        const data = response.data.data;
        setInvite(data);
        
        // Kontrolli 1: Nëse serveri thotë user_exists, kalo në Login
        if (data.user_exists) {
          setIsLoginMode(true);
        }
      })
      .catch((err) => setError(err.response?.data?.error || 'Invalid or expired invitation'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isLoginMode) {
        // 1. Bëj Login
        await login(invite.email, form.password);
        // 2. Prano ftesën
        await api.post('/companies/accept-invite', { token });
        navigate('/staff', { replace: true });
      } else {
        // 1. Provo të regjistrohesh
        await api.post('/auth/register-invited', { 
          token, 
          name: form.name, 
          password: form.password 
        });
        // 2. Bëj Login
        await login(invite.email, form.password);
        navigate('/staff', { replace: true });
      }
    } catch (err) {
      // Kontrolli 2: Nëse serveri kthen 409 (Email already registered), kalo automatikisht në Login
      if (err.response?.status === 409 || err.response?.data?.error?.includes('already registered')) {
        setIsLoginMode(true);
        setError('Ky email është i regjistruar. Ju lutem vendosni fjalëkalimin tuaj për t\'u loguar.');
      } else {
        setError(err.response?.data?.error || (isLoginMode ? 'Invalid credentials' : 'Could not create the staff account'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) return <div className="p-8 text-center text-red-600">Invitation token is missing</div>;
  if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;
  if (!invite) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <AuthLayout 
      title={isLoginMode ? "Login to accept" : "Join the team"} 
      subtitle={isLoginMode ? `Login with your existing account to join ${invite.company_name}` : `Create your staff account for ${invite.company_name}`}
    >
      {error && <div className="mb-5 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      
      <div className="mb-5 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
        <div><strong>Email:</strong> {invite.email}</div>
        <div><strong>Role:</strong> {invite.role_name}</div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Fusha e emrit shfaqet VETËM nëse nuk është Login Mode */}
        {!isLoginMode && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Full name</label>
            <input 
              type="text" 
              value={form.name} 
              onChange={(event) => setForm({ ...form, name: event.target.value })} 
              required 
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500" 
            />
          </div>
        )}
        
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
          <input 
            type="password" 
            value={form.password} 
            onChange={(event) => setForm({ ...form, password: event.target.value })} 
            required 
            minLength={6} 
            className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500" 
          />
        </div>

        <button type="submit" disabled={submitting} className="w-full rounded-lg bg-indigo-600 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60">
          {submitting 
            ? 'Processing...' 
            : (isLoginMode ? 'Login & Accept' : 'Accept invitation')}
        </button>
      </form>

      {/* Butoni për të kaluar manualisht nëse ka nevojë */}
      <div className="mt-6 text-center">
        {isLoginMode ? (
          <p className="text-sm text-slate-600">
            Don't have an account?{' '}
            <button onClick={() => { setIsLoginMode(false); setError(''); }} className="font-semibold text-indigo-600 hover:underline">
              Create one
            </button>
          </p>
        ) : (
          <p className="text-sm text-slate-600">
            Already have an account?{' '}
            <button onClick={() => { setIsLoginMode(true); setError(''); }} className="font-semibold text-indigo-600 hover:underline">
              Login here
            </button>
          </p>
        )}
      </div>
    </AuthLayout>
  );
}