import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const StaffRoute = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;

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
