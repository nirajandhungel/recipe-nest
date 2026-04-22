import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/ui/Loader';

const RoleRoute = ({ children, roles }) => {
  const { user, initializing } = useAuth();

  if (initializing) return <Loader fullScreen />;
  if (!user) return <Navigate to="/auth/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
};

export default RoleRoute;
