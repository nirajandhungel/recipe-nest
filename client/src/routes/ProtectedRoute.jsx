import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/ui/Loader';

const ProtectedRoute = ({ children }) => {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <Loader fullScreen />;
  if (!user) return <Navigate to="/auth/login" state={{ from: location }} replace />;

  return children;
};

export default ProtectedRoute;
