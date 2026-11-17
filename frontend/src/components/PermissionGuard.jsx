import { Navigate } from 'react-router-dom';
import { usePermissions } from '../contexts/PermissionsContext';
import { useCompany } from '../contexts/CompanyContext';

export default function PermissionGuard({ permission, children, fallback = '/staff' }) {
  const { hasPermission, loading } = usePermissions();
  const { loading: companyLoading } = useCompany();

  if (companyLoading || loading) {
    return <div className="p-12 text-center text-slate-500">Loading permissions...</div>;
  }

  if (!hasPermission(permission)) {
    return <Navigate to={fallback} replace />;
  }

  return children;
}
