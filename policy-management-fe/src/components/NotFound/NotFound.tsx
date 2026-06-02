import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import { Button } from '../ui/button';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleBackToHome = () => {
    navigate(isAuthenticated ? '/admin/policydashboard' : '/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="bg-white p-4 sm:p-6 max-w-md w-full text-center rounded-xl ">
        {/* 404 Icon */}
        <div className="mb-4">
          <div className="w-32 h-32 mx-auto flex items-center justify-center">
            <span className="text-7xl sm:text-8xl font-extrabold text-gray-800">404</span>
          </div>
        </div>

        {/* Heading and Subtext */}
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
          Page Not Found
        </h1>
        <p className="text-gray-600 text-sm sm:text-base mb-6 leading-relaxed">
          The page you’re looking for doesn’t exist or is restricted.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Button
            onClick={handleBackToHome}
            className="px-4 py-2 text-sm sm:text-base font-medium bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 rounded-md"
          >
            <Home className="w-4 h-4" />
            {isAuthenticated ? 'Dashboard' : 'Login'}
          </Button>

          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="px-4 py-2 text-sm sm:text-base font-medium border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center gap-2 rounded-md"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-6 border-t pt-4 border-gray-200">
          <p className="text-sm text-gray-500">
            If this seems like a mistake, contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
