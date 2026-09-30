import { useEffect, useState, useContext, createContext } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';

const CompanyContext = createContext(null);

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within CompanyProvider');
  }
  return context;
};

export function CompanyProvider({ children }) {
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [activeCompany, setActiveCompany] = useState(null);
  const [loadedForUser, setLoadedForUser] = useState(null);

  useEffect(() => {
    const resetState = window.setTimeout(() => {
      setCompanies([]);
      setActiveCompany(null);
    }, 0);

    if (!user) {
      return () => window.clearTimeout(resetState);
    }

    const resolvedRole = user.role || user?.companies?.[0]?.role || user?.company_role || 'customer';

    api.get('/companies').then((response) => {
      const list = response.data?.data || [];
      const allowedCompanies = list.filter((company) =>
        !['customer'].includes(company?.role || resolvedRole)
      );
      setCompanies(list);

      if (resolvedRole === 'customer') {
        setActiveCompany(null);
        sessionStorage.removeItem('activeCompanyId');
        setLoadedForUser(user.id);
        return;
      }

      const saved = sessionStorage.getItem('activeCompanyId');
      const found =
        (saved ? list.find((c) => c.id == saved) : null) ||
        allowedCompanies[0] ||
        list[0];

      if (found) {
        setActiveCompany(found);
        sessionStorage.setItem('activeCompanyId', found.id);
      } else {
        setActiveCompany(null);
        sessionStorage.removeItem('activeCompanyId');
      }
      setLoadedForUser(user.id);
    });

    return () => window.clearTimeout(resetState);
  }, [user]);

  const switchCompany = (id) => {
    const found = companies.find((c) => c.id == id);
    if (found) {
      setActiveCompany(found);
      sessionStorage.setItem('activeCompanyId', id);
    }
  };

  const refreshCompanies = async () => {
    const response = await api.get('/companies');
    const list = response.data?.data || [];
    setCompanies(list);
    return list;
  };

  return (
    <CompanyContext.Provider
      value={{
        companies,
        activeCompany: loadedForUser === user?.id ? activeCompany : null,
        switchCompany,
        refreshCompanies,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}