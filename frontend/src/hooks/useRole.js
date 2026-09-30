import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';

export function useRole() {
  const { user } = useAuth();
  const { activeCompany } = useCompany();

  const resolvedUserRole = user?.role || user?.companies?.[0]?.role || user?.company_role;
  if (resolvedUserRole) return resolvedUserRole;
  if (activeCompany?.role) return activeCompany.role;
  return 'customer';
}

export function useHasRole(...allowedRoles) {
  const role = useRole();
  return allowedRoles.includes(role);
}