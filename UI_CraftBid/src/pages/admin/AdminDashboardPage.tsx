import React from 'react';
import AdminManualDeposit from '@/components/admin/AdminManualDeposit';

const AdminDashboardPage: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <p>Welcome to the admin dashboard.</p>

      <AdminManualDeposit />

    </div>
  );
};

export default AdminDashboardPage;
