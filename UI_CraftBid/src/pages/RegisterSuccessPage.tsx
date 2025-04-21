import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

const RegisterSuccessPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { message?: string };
  const message = state?.message || 'Registration submitted! Please check your email to verify your account.';

  return (
    <>
      <div className='flex justify-between items-center p-5'>
        <div className='pl-2'>
          <img src="/public/logo.png" className="h-10" alt="Logo" />
        </div>
        <p className='font-medium'>
          Already have an account? <Link to="/login" className="text-accent1 underline">Sign In</Link>
        </p>
      </div>
      <div className='flex flex-col items-center justify-center w-fit mx-auto mt-20'>
        <div className='text-center p-4 border rounded-md bg-green-50 w-80'>
          <h3 className='text-lg font-medium text-green-800'>Registration Submitted!</h3>
          <p className='mt-2 text-sm text-green-700'>{message}</p>
          <button
            onClick={() => navigate('/login')}
            className='mt-4 py-2 px-4 bg-indigo-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-indigo-700'
          >
            Proceed to Login
          </button>
        </div>
      </div>
    </>
  );
};

export default RegisterSuccessPage;
