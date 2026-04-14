import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from './Loading';

const StaffRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = String(user.role || '').toLowerCase();
  if (role === 'staff' || role === 'admin') {
    return children;
  }

  return <Navigate to="/unauthorized" replace />;
};

export default StaffRoute;
