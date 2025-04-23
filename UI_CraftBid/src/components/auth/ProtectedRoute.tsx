import React, { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // Destructure isVerified from useAuth as well
  const { user, isLoading, isVerified } = useAuth();
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

   // User is logged in, BUT check if their email is verified
   if (!isVerified) {
     // User is logged in but not verified, redirect to the status page
     // Pass relevant info like email if needed by the status page, though it should fetch its own
     console.log("ProtectedRoute: User authenticated but not verified. Redirecting to /status.");
     // Pass user's primary role if available in context
     const role = user.roles?.[0]?.name;
     return <Navigate to="/status" state={{ email: user.email, role: role }} replace />;
   }

   // User is logged in AND verified, render the child component
   return <>{children}</>;
};

export default ProtectedRoute;
