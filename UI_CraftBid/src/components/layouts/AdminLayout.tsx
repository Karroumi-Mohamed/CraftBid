import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import LogoutButton from '../auth/LogoutButton';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, Users, Shapes, Settings, ShieldCheck, Gavel, Banknote, FileText } from 'lucide-react';

const AdminSidebar: React.FC = () => {
  const { user } = useAuth();

  const isAdmin = user?.roles?.some(role => role.name === 'admin');

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="w-64 h-screen bg-gray-900 text-gray-200 p-4 border-r border-gray-700 flex flex-col">
      <div className="mb-6">
        <Link to="/admin" className='pl-2 flex items-center gap-2'>
          <img src="/logo.png" className="h-8 invert brightness-0" alt="CraftBid" />
           <span className="font-semibold text-lg text-gray-100">Admin Panel</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1">
        <p className="text-xs uppercase text-gray-500 font-semibold mb-2 px-3">Management</p>
        <Link to="/admin" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-700 hover:text-white transition-colors">
            <LayoutDashboard size={18} /> Dashboard
        </Link>
        <Link to="/admin/users" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-700 hover:text-white transition-colors">
            <Users size={18} /> User Management
        </Link>
        <Link to="/admin/categories" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-700 hover:text-white transition-colors">
            <Shapes size={18} /> Category Management
        </Link>
        <Link to="/admin/artisans" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-700 hover:text-white transition-colors">
            <ShieldCheck size={18} /> Artisan Verification
        </Link>
        <Link to="/admin/products" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-700 hover:text-white transition-colors">
            <Shapes size={18} /> Product Management
        </Link>
        <Link to="/admin/auctions" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-700 hover:text-white transition-colors">
            <Gavel size={18} /> Auction Management
        </Link>
        <Link to="/admin/withdrawals" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-700 hover:text-white transition-colors">
            <Banknote size={18} /> Withdrawal Requests
        </Link>
        <Link to="/admin/reports" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-700 hover:text-white transition-colors">
            <FileText size={18} /> Financial Reports
        </Link>

        <p className="text-xs uppercase text-gray-500 font-semibold pt-4 mb-2 px-3">System</p>
         <Link to="/admin/settings" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-700 hover:text-white transition-colors">
            <Settings size={18} /> Settings
        </Link>
      </nav>
      <div className="mt-auto border-t border-gray-700 pt-4">
         <div className="text-sm mb-2 px-3">
            Logged in as: <span className="font-medium">{user?.name}</span>
         </div>
        <LogoutButton className="w-full justify-center bg-gray-700 hover:bg-gray-600 text-white" />
      </div>
    </div>
  );
};


const AdminLayout: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading admin area...</div>;
  }

  if (!user || !user.roles?.some(role => role.name === 'admin')) {
     return <div className="flex items-center justify-center min-h-screen">Access Denied. Requires Admin privileges.</div>;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AdminSidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto bg-gray-50 dark:bg-gray-900/50">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
