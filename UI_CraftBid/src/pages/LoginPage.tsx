import React from 'react';
import LoginForm from '../components/auth/LoginForm';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/layouts/AuthLayout';

const LoginPage: React.FC = () => {
    return (
        <AuthLayout>
            <>
                <div className='flex justify-between items-center'>
                    <div className='pl-2'>
                        <img src="/public/logo.png" className="h-10 " alt="Logo" />
                    </div>
                    <p className='font-medium'>
                        Don't have an account? <Link to="/register" className="text-accent1 underline">Sign Up</Link>
                    </p>
                </div>
                <div className='flex flex-col items-center justify-center w-fit mx-auto'>

                    <div className='flex flex-col items-center justify-center w-full mt-20'>
                        <h1 className='text-black text-2xl font-bold'>Welcome back to CraftBid!</h1>
                        <p className='text-lg font-semibold text-gray-400 px-10 '>Please enter your details to sign in your account</p>
                    </div>

                    <div className='flex flex-col items-center justify-center w-full mt-8'>
                        <div className='flex flex-col gap-4 w-full'>
                            <button className="flex font-bold w-full items-center justify-center gap-2 rounded-md border-black bg-white px-4 text-black hover:bg-gray-50 py-3 border-2">
                                <img src="/public/auth/google.svg" className="size-7" alt="Google logo" />
                                Continue with Google
                            </button>

                            <button className="flex font-bold w-full items-center justify-center gap-2 rounded-md border-black bg-white px-4  text-black hover:bg-gray-50 py-3 border-2">
                                <img src="/public/auth/apple.svg" className="size-7" alt="Apple logo" />
                                Continue with Apple
                            </button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-2 border-gray-300"></div>
                                </div>
                                <div className="relative flex justify-center text-xs font-semibold ">
                                    <span className="bg-white px-4 text-gray-400">Or sign in with</span>
                                </div>
                            </div>
                        </div>
                        <LoginForm />
                        <Link to="/forgot-password" className="text-black mt-4 underline">
                            Forgot password?
                        </Link>
                    </div>
                </div>
            </>
        </AuthLayout>
    );
};

export default LoginPage;
