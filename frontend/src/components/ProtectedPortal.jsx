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

//this code checks roles, and auth. if it's not a user, it redirects to login,
//if role is superadmin, it redirects to superadmin
//if role  is staff, redirect to staff, if role admin ,owner and manager redirect to admindashboard.
//but if none of the roles matches , then is a client, which pages are allowed to open from children.



