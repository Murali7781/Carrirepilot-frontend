import { Link, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="page-loading">Loading your workspace...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export function PublicRoute({ children }) {
  const { user } = useAuth();

  if (user) {
    const role = String(user.role || '').toLowerCase();
    return <Navigate to={role === 'recruiter' ? '/jobs' : '/dashboard'} replace />;
  }

  return children;
}

export function RoleRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  const role = typeof user?.role === 'string' ? user.role.toLowerCase() : '';

  if (!Array.isArray(allowedRoles) || !allowedRoles.includes(role)) {
    return (
      <section className="empty-state app-forbidden" role="alert">
        <h2>Access not available</h2>
        <p>Your account does not have permission to open this workspace.</p>
        <Link className="btn btn-primary" to="/profile">Go to your profile</Link>
      </section>
    );
  }

  return children || <Outlet />;
}
