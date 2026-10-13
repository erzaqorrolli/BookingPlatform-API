import { useEffect, useState, useContext, createContext } from 'react';
import api from '../api/client';

const AuthContext = createContext(undefined); 

export function useAuth() {
  const context = useContext(AuthContext); //reads AuthContext value
  if (context === undefined) { // checks if context exists
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

function getCsrfToken() { //reads csrf token from cookies, or returns null
  const match = document.cookie.match(/(^| )csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[2]) : null;
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null); //saves user 
  const [loading, setLoading] = useState(true); // saves loading

  const clearAuthSession = () => { // cleans Session
    sessionStorage.removeItem('activeCompanyId'); //deletes from session storage. session storage saves temporary tokens, and deletes when tab closes.
    localStorage.removeItem('activeCompanyId'); // deletes from localstroage. local storage saves tokens permanently, they stay even after closing the tab
    setUser(null);// deletes user, user logges out of app
  };

  const normalizeUser = (data) => { // normalizes users data which come from backend, makes sure that companies and role are coming in right format
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

  useEffect(() => { // when app opens, checks if user is logged in and is calling /auth/me, if yesit saves the user, if not deletes it
    api.get('/auth/me') // useEffect is react hooks that executes code when components change addiction
      .then((response) => {
        const data = response.data?.data || response.data;
        setUser(normalizeUser(data));
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

 const login = async (email, password) => { // when user logs in , sends email,passwod, saves token , saves crf token and user in state
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

  const register = async (name, email, password) => { // registers name email password in backend and gives response
    const response = await api.post('/auth/register', { name, email, password });
    return response.data?.data || response.data;
  };

 const logout = async () => { // when user loges out , sends request in backend, cleans session, removes token and csrf token
  try {
    await api.post('/auth/logout');
  } catch {}
  clearAuthSession();
  localStorage.removeItem('auth_token');   
  document.cookie = 'csrf_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
};

  return ( //offers auth data (user,loading,login,register,logout) for all children of authprovider
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}