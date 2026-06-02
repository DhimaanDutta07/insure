import { Navigate } from 'react-router-dom'; 
import { useAuth } from '../Context/AuthContext';  

// Updated ProtectedRoute component for permission-based access control
export const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  requiredPermission?: string;
}> = ({ children, requiredPermission }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  
  // Show loading state or spinner while checking authentication
  if (isLoading) {
    return <div>Loading...</div>; // Or your loading component
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }
    
  // console.log(user)
  // Check for web access first
  if (!user?.permissions?.web) {
    return <Navigate to="/unauthorized" />;
  }
    
  // Check for specific permission in web permissions array
  if (requiredPermission && user?.permissions?.web) {
    const hasAccess = user.permissions.web.includes(requiredPermission);
    if (!hasAccess) {
      return <Navigate to="/unauthorized" />;
    }
  }
    
  return <>{children}</>;
};