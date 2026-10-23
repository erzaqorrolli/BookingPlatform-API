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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() =>
    Boolean(localStorage.getItem('auth_token') || localStorage.getItem('refresh_token'))
  );

  const clearAuthSession = () => {
    sessionStorage.removeItem('activeCompanyId');
    localStorage.removeItem('activeCompanyId');
    localStorage.removeItem('user'); // Fshijmë user-in nga localStorage
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
    if (!localStorage.getItem('auth_token') && !localStorage.getItem('refresh_token')) {
      setLoading(false);
      return;
    }

    // Nëse e kemi user-in e ruajtur, e vendosim menjëherë (për shpejtësi)
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {}
    }

    api.get('/auth/me')
      .then((response) => {
        const data = response.data?.data || response.data;
        const normalized = normalizeUser(data);
        setUser(normalized);
        localStorage.setItem('user', JSON.stringify(normalized)); // E ruajmë në localStorage
      })
      .catch(() => {
        setUser(null);
        localStorage.removeItem('user');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    clearAuthSession();

    const response = await api.post('/auth/login', { email, password });
    const data = response.data?.data || response.data;

    if (data.access_token) {
      localStorage.setItem('auth_token', data.access_token);
    }

    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token);
    }

    if (data.csrf_token) {
      document.cookie = `csrf_token=${data.csrf_token}; path=/; SameSite=Lax`;
    }

    const normalizedUser = normalizeUser(data);
    setUser(normalizedUser);
    localStorage.setItem('user', JSON.stringify(normalizedUser)); // RUAJTJA KRYESORE

    return { ...data, user: normalizedUser, role: normalizedUser.role };
  };

  const register = async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data?.data || response.data;
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    try {
      await api.post('/auth/logout', { refresh_token: refreshToken });
    } catch {}
    clearAuthSession();
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    document.cookie = 'csrf_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}