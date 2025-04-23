import React, { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext'; // Use @ alias
import { Navigate, useLocation } from 'react-router-dom';

interface AdminRouteProps {
  children: ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, isLoading, isVerified } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="p-4 text-center">Checking authentication...</div>;
  }

  // 1. Check if user is logged in
  if (!user) {
    return <Navigate to="/login" state={{ from: location, message: "Admin access requires login." }} replace />;
  }

  // 2. Check if user's email is verified
  if (!isVerified) {
    // Redirect to status page if not verified
    return <Navigate to="/status" state={{ email: user.email, role: user.roles?.[0]?.name, message: "Admin access requires email verification." }} replace />;
  }

  // 3. Check if user has the 'admin' role
  const isAdmin = user.roles?.some(role => role.name === 'admin');
  if (!isAdmin) {
    // Redirect to regular dashboard or show an access denied message if logged in but not admin
    console.warn("AdminRoute: Access denied. User does not have admin role.");
    // Redirecting to user dashboard might be better UX than just showing denied message
    return <Navigate to="/dashboard" state={{ message: "Access denied. Admin privileges required." }} replace />;
    // Alternatively: return <div>Access Denied. Admin privileges required.</div>;
  }

  // User is logged in, verified, and has admin role - render the admin content
  return <>{children}</>;
};

export default AdminRoute;
