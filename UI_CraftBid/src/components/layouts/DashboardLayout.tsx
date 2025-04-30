import React, { ReactNode } from 'react';
import { Link, Outlet } from 'react-router-dom'; // Use Outlet for nested routes
import LogoutButton from '../auth/LogoutButton';
import { useAuth } from '@/contexts/AuthContext'; // Use @ alias

// Placeholder for Sidebar component - we'll create this next
const SidebarPlaceholder: React.FC = () => {
  const { user } = useAuth();
  const isArtisan = user?.roles?.some(role => role.name === 'artisan');

  return (
    <div className="w-64 h-screen bg-gray-100 dark:bg-gray-800 p-4 border-r dark:border-gray-700 flex flex-col">
      <div className="mb-6">
        <Link to="/dashboard" className='pl-2'>
          <img src="/logo.png" className="h-8" alt="CraftBid" />
        </Link>
      </div>
      <nav className="flex-1 space-y-2">
        <p className="text-xs uppercase text-gray-500 font-semibold mb-2">Menu</p>
        <Link to="/dashboard" className="block px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">Dashboard</Link>
        <Link to="/dashboard/products" className="block px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">Products</Link>
        <Link to="/dashboard/auctions" className="block px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">Auctions</Link>
        {isArtisan && (
          <>
            <p className="text-xs uppercase text-gray-500 font-semibold pt-4 mb-2">Artisan</p>
            <Link to="/dashboard/my-products" className="block px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">My Products</Link>
            <Link to="/dashboard/my-auctions" className="block px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">My Auctions</Link>
            <Link to="/dashboard/artisan-profile" className="block px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">My Profile</Link>
            <Link to="/dashboard/wallet" className="block px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">My Wallet</Link>
          </>
        )}
         {!isArtisan && (
          <>
             <p className="text-xs uppercase text-gray-500 font-semibold pt-4 mb-2">Buyer</p>
             <Link to="/dashboard/my-bids" className="block px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">My Bids</Link>
             <Link to="/dashboard/watchlist" className="block px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">Watchlist</Link>
             <Link to="/dashboard/wallet" className="block px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">Wallet</Link>
          </>
         )}
         <Link to="/dashboard/settings" className="block px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">Settings</Link>
      </nav>
      <div className="mt-auto">
        {/* User info can go here */}
        <LogoutButton />
      </div>
    </div>
  );
};


const DashboardLayout: React.FC = () => {
  const { user, isLoading } = useAuth(); // Get user info for personalization

  if (isLoading) {
    return <div>Loading dashboard...</div>; // Or a more sophisticated loader
  }

  if (!user) {
     // This shouldn't happen if ProtectedRoute is used, but good fallback
     return <div>Error: User not found.</div>;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <SidebarPlaceholder />

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {/* Outlet will render the matched child route component */}
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
