import { Navigate } from 'react-router-dom';
import { useRole } from '../hooks/useRole';


export default function RoleGuard({ allowed, children, fallback = '/admin' }) {
  const role = useRole();

  if (!allowed.includes(role)) {
    return <Navigate to={fallback} replace />;
  }

  return children;
}