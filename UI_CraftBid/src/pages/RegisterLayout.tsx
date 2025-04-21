import React from 'react';
import { Outlet } from 'react-router-dom';
import AuthLayout from '../components/layouts/AuthLayout';

const RegisterLayout: React.FC = () => (
  <AuthLayout>
    <>
      <Outlet />
    </>
  </AuthLayout>
);  

export default RegisterLayout;
