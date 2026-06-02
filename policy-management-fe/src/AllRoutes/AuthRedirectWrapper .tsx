import { Navigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';

// This component redirects authenticated users away from auth pages
const AuthRedirectWrapper = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Show nothing while authentication state is loading
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/admin/policydashboard" replace />;
  }
  
  // Otherwise show the login/register page
  return <>{children}</>;
};

export default AuthRedirectWrapper;