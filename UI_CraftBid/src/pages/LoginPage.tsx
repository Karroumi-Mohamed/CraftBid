import React from 'react';
import LoginForm from '../components/auth/LoginForm';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/layouts/AuthLayout';

const LoginPage: React.FC = () => {
    return (
        <AuthLayout>
            <>
                <div className='flex justify-between items-center p-5'>
                    <div className='pl-2'>
                        <img src="/public/logo.png" className="h-10" alt="Logo" />
                    </div>
                    <p className='font-medium'>
                        Don't have an account? <Link to="/register" className="text-accent1 underline">Sign Up</Link>
                    </p>
                </div>

                <div className='flex flex-col items-center justify-center max-w-md mx-auto px-6'>
                    <h1 className='text-black text-2xl font-bold mt-10 w-full text-center'>Welcome back to CraftBid!</h1>
                    <p className='text-gray-500 text-sm font-medium mt-1 mb-6 w-full text-center'>Please enter your details to sign in your account</p>

                    <div className='flex flex-col w-full gap-4'>
                        <button 
                            type="button"
                            onClick={() => {
                                const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
                                window.location.href = `${backendUrl}/api/auth/google/redirect`;
                            }}
                            className="flex font-medium w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-3 text-black hover:bg-gray-50 shadow-sm"
                        >
                            <img src="/public/auth/google.svg" className="h-6 w-6" alt="Google logo" />
                            Continue with Google
                        </button>

                        <div className="relative my-6 w-full">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-xs font-medium">
                                <span className="bg-white px-4 text-gray-500">Or sign in with</span>
                            </div>
                        </div>
                    </div>
                    
                    <LoginForm />
                    
                    <Link to="/forgot-password" className="text-accent1 mt-4 text-sm font-medium self-end">
                        Forgot password?
                    </Link>
                </div>
            </>
        </AuthLayout>
    );
};

export default LoginPage;
