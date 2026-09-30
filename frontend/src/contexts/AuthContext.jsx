import { useEffect, useState, useContext, createContext } from 'react';
import api from '../api/client';

const AuthContext = createContext(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

function getCsrfToken() {
  const match = document.cookie.match(/(^| )csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[2]) : null;
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  const clearAuthSession = () => {
    sessionStorage.removeItem('activeCompanyId');
    localStorage.removeItem('activeCompanyId');
    setUser(null);
  };

  const normalizeUser = (data) => {
    const payload = data?.user || data || {};
    const companies = payload.companies || data?.companies || [];
    const roleFromUser = payload.role || payload.company_role;
    const roleFromCompanies =
      companies.find((c) => c?.role && !['customer'].includes(c.role))?.role ||
      companies[0]?.role ||
      'customer';

    return {
      ...payload,
      companies,
      role: roleFromUser || roleFromCompanies,
    };
  };

  useEffect(() => {
    api.get('/auth/me')
      .then((response) => {
        const data = response.data?.data || response.data;
        setUser(normalizeUser(data));
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

 const login = async (email, password) => {
  clearAuthSession();

  const response = await api.post('/auth/login', { email, password });
  const data = response.data?.data || response.data;

  if (data.token) {
    localStorage.setItem('auth_token', data.token);
  }

  if (data.csrf_token) {
    document.cookie = `csrf_token=${data.csrf_token}; path=/; SameSite=Lax`;
  }

  const normalizedUser = normalizeUser(data);
  setUser(normalizedUser);
  return { ...data, user: normalizedUser, role: normalizedUser.role };
};

  const register = async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data?.data || response.data;
  };

 const logout = async () => {
  try {
    await api.post('/auth/logout');
  } catch {}
  clearAuthSession();
  localStorage.removeItem('auth_token');   
  document.cookie = 'csrf_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
};
  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}