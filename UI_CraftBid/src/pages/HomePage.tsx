import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import LogoutButton from '../components/auth/LogoutButton';

const HomePage: React.FC = () => {
  const { user, isLoading } = useAuth(); // Get user state

  // Note: Protection logic will be handled by ProtectedRoute component wrapping this in main.tsx
  // This component assumes it's only rendered when user is authenticated.

  if (isLoading) {
    return <div className="p-4 text-center">Loading user data...</div>;
  }

  if (!user) {
     // Should ideally not happen if ProtectedRoute works, but good fallback
     return <div className="p-4 text-center">Error: User data not available.</div>;
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Home Page</h1>
      <p className="mb-2">Welcome, <span className="font-semibold">{user.name}</span>!</p>
      <p className="mb-2 text-sm text-gray-600">Email: {user.email}</p>
      <p className="mb-4 text-sm text-gray-600">Roles: {user.roles.map(role => role.name).join(', ')}</p>
      <LogoutButton />
    </div>
  );
};

export default HomePage;
