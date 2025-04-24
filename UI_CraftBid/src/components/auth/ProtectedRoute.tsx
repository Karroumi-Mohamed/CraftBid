import React, { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading, isVerified } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="p-4 text-center">Checking authentication...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isVerified) {
    return <Navigate to="/status" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
