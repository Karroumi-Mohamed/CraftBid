import React, { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Optional: Show a loading spinner or skeleton screen
    return <div className="p-4 text-center">Checking authentication...</div>;
  }

  if (!user) {
    // User not logged in, redirect them to the /login page
    // Pass the current location state so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is logged in, render the child component (the protected page)
  return <>{children}</>;
};

export default ProtectedRoute;
