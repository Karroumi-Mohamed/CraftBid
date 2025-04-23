 import React from 'react';
 import { useAuth } from '../../contexts/AuthContext';
 import { useNavigate } from 'react-router-dom';
 import { cn } from '@/lib/utils'; // Import cn utility

 // Define props interface to accept className
 interface LogoutButtonProps {
   className?: string;
 }

 const LogoutButton: React.FC<LogoutButtonProps> = ({ className }) => { // Add className prop
   const { logout, isLoading } = useAuth();
   const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      console.log('Logout successful');
      navigate('/login'); // Redirect to login page after logout
    } catch (error) {
      console.error('Logout failed:', error);
      // Optionally show an error message to the user
    }
  };

  return (
     <button
       onClick={handleLogout}
       disabled={isLoading}
       // Use cn to merge default classes with passed className
       className={cn(
         "py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50",
         className // Apply the passed className here
       )}
     >
       {isLoading ? 'Logging out...' : 'Log Out'}
    </button>
  );
};

export default LogoutButton;
