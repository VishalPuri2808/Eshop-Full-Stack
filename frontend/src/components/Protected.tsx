import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Protected({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export function AdminOnly({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user || !user.isAdmin) return <Navigate to="/" replace />;
  return children;
}
