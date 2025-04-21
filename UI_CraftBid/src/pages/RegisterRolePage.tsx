import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const RegisterRolePage: React.FC = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<'buyer' | 'artisan' | ''>('');

  const handleNext = () => {
    if (role) {
      navigate('/register/details', { state: { role } });
    }
  };

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
      <div className='flex flex-col items-center justify-center w-fit mx-auto'>
        <div className='flex flex-col items-center justify-center w-full mt-20'>
          <h1 className='text-black text-2xl font-bold'>Welcome to CraftBid!</h1>
          <p className='text-lg font-semibold text-gray-400 px-10'>Who are you?</p>
        </div>

        <div className="flex flex-col items-center mt-8">
          <div className="flex flex-col sm:flex-row justify-center items-start gap-16">
            <div className="flex flex-col items-center text-center w-40">
              <button
                type="button"
                onClick={() => setRole('buyer')}
                className={`border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent2 w-full h-44 overflow-hidden ${role === 'buyer' ? 'ring-2 ring-accent2' : 'border-gray-300'}`}
              >
                <img src="/public/auth/buyer.png" className="w-full h-full object-cover" alt="Buyer icon" />
              </button>
              <span className="font-bold block mt-3">Buyer</span>
            </div>

            <div className="flex flex-col items-center text-center w-40">
              <button
                type="button"
                onClick={() => setRole('artisan')}
                className={`border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent2 w-full h-44 overflow-hidden ${role === 'artisan' ? 'ring-2 ring-accent2' : 'border-gray-300'}`}
              >
                <img src="/public/auth/artisan.png" className="w-full h-full object-cover" alt="Artisan icon" />
              </button>
              <span className="font-bold block mt-3">Artisan</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleNext}
            disabled={!role}
            className="py-2 px-6 text-lg font-semibold text-black focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
};

export default RegisterRolePage;
