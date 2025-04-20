import React from 'react';
import LoginForm from '../components/auth/LoginForm';
import { Link } from 'react-router-dom';
import CarouselIndicator from '../components/utils/CarouselIndicator';

const LoginPage: React.FC = () => {
    return (
        <div className="flex flex-row gap-2 items-center justify-center h-screen bg-black p-2">
            <div className="hidden relative h-full lg:flex lg:w-3/5 xl:w-1/2 flex-col justify-end overflow-hidden text-white rounded-lg">

                <img
                    src="/auth/sideImage_1.jpg"
                    className="h-full object-cover object-center"
                    alt="Side"
                />

                <div className="absolute inset-0 z-10 flex flex-col justify-between p-4 pointer-events-none">
                    <div className="flex h-full w-full justify-end items-center flex-col mb-5 gap-6 pointer-events-auto">
                        <img src="/public/auth/sideIcon_1.png" className='size-14' />
                        <h1 className="text-5xl  text-center pointer-events-auto font-bodoni font-black text-transparent bg-clip-text bg-gradient-to-b from-blancasi-500 to-[#77FFED]">
                            Experience The Souk Modernized
                        </h1>
                        <CarouselIndicator count={3} currentIndex={0} onClick={() => { }} />
                    </div>

                </div>
            </div>

            <div className="w-full h-full ml-auto p-5 rounded-lg shadow-md bg-white font-montserrat">
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
            </div>
        </div>
    );
};

export default LoginPage;
