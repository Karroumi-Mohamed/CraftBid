import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const DashboardLayout: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <p className="text-lg font-montserrat">Loading dashboard...</p>
    </div>;
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">
      <p className="text-lg font-montserrat">Error: User not found.</p>
    </div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
