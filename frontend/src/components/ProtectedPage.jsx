import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../hooks/useRole';
import AdminLayout from './AdminLayout';

export default function ProtectedPage({ allowed, children }) {
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

  if (role === 'customer') {
    return <Navigate to="/portal" replace />;
  }

  if (role === 'staff' && !allowed?.includes('staff')) {
    return <Navigate to="/staff" replace />;
  }

  if (allowed && !allowed.includes(role)) {
    return <Navigate to="/admin" replace />;
  }

  return <AdminLayout>{children}</AdminLayout>;
}

//this code checks roles and auth
//if it's not a user redirect to login, 
// if role is customer redirect to portal
//if role staff and not allowed role (staff) redirect to staff
// if user is not allowed redirect to admin
//if all if-s pass render the page (children) with Adminlayout