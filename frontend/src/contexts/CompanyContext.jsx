import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';

const CompanyContext = createContext(null);

export function CompanyProvider({ children }) {
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [activeCompany, setActiveCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCompanies([]);
      setActiveCompany(null);
      setLoading(false);
      return;
    }

    const fetchCompanies = async () => {
      try {
        const res = await api.get('/companies');
        const list = res.data.data || [];
        setCompanies(list);

        if (list.length > 0) {
          const savedId = localStorage.getItem('activeCompanyId');
          
          if (user.role === 'staff') {
            setActiveCompany(list[0]);
            localStorage.setItem('activeCompanyId', list[0].id);
          } else {
            const matched = list.find(c => String(c.id) === String(savedId));
            const chosen = matched || list[0];
            setActiveCompany(chosen);
            localStorage.setItem('activeCompanyId', chosen.id);
          }
        }
      } catch (err) {
        console.error('Failed to load companies', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, [user]);

  const switchCompany = (id) => {
    if (user?.role === 'staff') return;

    const company = companies.find(c => String(c.id) === String(id));
    if (company) {
      setActiveCompany(company);
      localStorage.setItem('activeCompanyId', company.id);
    }
  };

  const refreshCompanies = async () => {
    if (!user) return;
    try {
      const res = await api.get('/companies');
      const list = res.data.data || [];
      setCompanies(list);
      
      if (activeCompany) {
        const updated = list.find(c => c.id === activeCompany.id);
        if (updated) setActiveCompany(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <CompanyContext.Provider value={{
      companies,
      activeCompany,
      switchCompany,
      refreshCompanies,
      loading
    }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}