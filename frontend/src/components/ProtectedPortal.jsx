import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../hooks/useRole';
import PortalLayout from './PortalLayout';

export default function ProtectedPortal({ children }) {
  const { user, loading } = useAuth();
  const role = useRole();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'superadmin') {
  return <Navigate to="/admin/superadmin" replace />;
}

if (['owner', 'admin', 'manager', 'staff'].includes(role)) {
  if (role === 'staff') {
    return <Navigate to="/staff" replace />;
  }
  return <Navigate to="/admin" replace />;
}

  return <PortalLayout>{children}</PortalLayout>;
}