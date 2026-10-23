import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import { useCompany } from './CompanyContext';
import { useRole } from '../hooks/useRole';

const PermissionsContext = createContext();

export function PermissionsProvider({ children }) {
  const { activeCompany } = useCompany();
  const role = useRole();
  const [permissions, setPermissions] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeCompany) {
      setPermissions([]);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    // Nëse është owner ose admin, ka çdo leje
    if (role === 'owner' || role === 'admin') {
      setPermissions(['*']);
      setIsAdmin(true);
      setLoading(false);
      return;
    }

    const fetchPermissions = async () => {
      try {
        const res = await api.get(`/companies/${activeCompany.id}/my-permissions`);
        setPermissions(res.data.data.permissions || []);
        setIsAdmin(res.data.data.is_admin || false);
      } catch (err) {
        console.error('Failed to load permissions', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [activeCompany, role]);

  const hasPermission = (permissionKey) => {
    if (isAdmin) return true;
    return permissions.includes(permissionKey);
  };

  return (
    <PermissionsContext.Provider value={{ permissions, isAdmin, hasPermission, loading }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  return useContext(PermissionsContext);
}