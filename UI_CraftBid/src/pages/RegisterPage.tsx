import React from 'react';
import RegisterForm from '../components/auth/RegisterForm';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/layouts/AuthLayout';

const RegisterPage: React.FC = () => {
  return (
    <AuthLayout>
        <>
            <div className='flex justify-between items-center p-5'>
                <div className='pl-2'>
                    <img src="/public/logo.png" className="h-10 " alt="Logo" />
                </div>
                <p className='font-medium'>
                    Already have an account? <Link to="/login" className="text-accent1 underline">Sign In</Link>
                </p>
            </div>
            <div className='flex flex-col items-center justify-center w-fit mx-auto'>

                <div className='flex flex-col items-center justify-center w-full mt-20'>
                    <h1 className='text-black text-2xl font-bold'>Welcome to CraftBid!</h1>
                    <p className='text-lg font-semibold text-gray-400 px-10 '>Who are you?</p>
                </div>

                <div className='flex flex-col items-center justify-center w-full mt-8'>
                    <RegisterForm />
                </div>
            </div>
        </>
    </AuthLayout>
  );
};

export default RegisterPage;
