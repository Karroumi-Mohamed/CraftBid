import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, ArrowLeft } from "lucide-react";

const RegisterDetailsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { register } = useAuth();
  const state = location.state as { role?: 'buyer' | 'artisan' };
  const role = state?.role;

  useEffect(() => {
    if (!role) {
      navigate('/register');
    }
  }, [role, navigate]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    setError(null);
    setLoading(true);

    if (password !== passwordConfirmation) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const response = await register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        role,
      });
      const message = response.data.message || 'Registration successful! Please check your email to verify.';
      navigate('/register/success', { state: { message } });
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.response?.data?.errors) {
        const messages = Object.values(err.response.data.errors).flat().join(' ');
        setError(messages || 'Validation failed.');
      } else {
        setError(err.response?.data?.message || err.message || 'An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!role) return null;

  return (
    <>
      <div className='flex justify-between items-center p-5'>
        <div className='pl-2'>
          <img src="/public/logo.png" className="h-10" alt="Logo" />
        </div>
        <p className='font-medium'>
          Have an account? <Link to="/login" className="text-accent1 underline">Sign In</Link>
        </p>
      </div>
      
      <div className='flex flex-col items-center justify-center max-w-md mx-auto px-6'>
        <h1 className='text-black text-2xl font-bold mt-10 w-full text-center'>Sign up as {role === 'artisan' ? 'an' : 'a'} {role.charAt(0).toUpperCase() + role.slice(1)}</h1>
        <p className='text-gray-500 text-sm font-medium mt-1 mb-6 w-full text-center'>Please fill in your data</p>
        
        {error && <div className="text-red-500 bg-red-100 p-3 rounded mb-4 text-sm w-full">{error}</div>}
        
        <form onSubmit={handleSubmit} className='space-y-5 w-full'>
          <input type='hidden' value={role} name='role' />
          
          <div>
            <label htmlFor='name' className='block text-sm font-medium text-gray-700 mb-1'>
              {role === 'artisan' ? 'Business name' : 'Name'}
            </label>
            <input 
              id='name' 
              name='name' 
              type='text' 
              placeholder={role === 'artisan' ? 'Your business name' : 'John Doe'}
              required 
              className='block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-accent1 focus:border-accent1' 
              value={name} 
              onChange={e => setName(e.target.value)} 
              disabled={loading} 
            />
          </div>
          
          <div>
            <label htmlFor='email' className='block text-sm font-medium text-gray-700 mb-1'>Email</label>
            <input 
              id='email' 
              name='email' 
              type='email' 
              placeholder='johndeo@gmail.com'
              autoComplete='email' 
              required 
              className='block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-accent1 focus:border-accent1' 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              disabled={loading} 
            />
          </div>
          
          <div>
            <label htmlFor='password' className='block text-sm font-medium text-gray-700 mb-1'>Password</label>
            <input 
              id='password' 
              name='password' 
              type='password' 
              placeholder='minimum 8 characters'
              required 
              className='block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-accent1 focus:border-accent1' 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              disabled={loading} 
            />
          </div>
          
          <div>
            <label htmlFor='password_confirmation' className='block text-sm font-medium text-gray-700 mb-1'>Confirm Password</label>
            <input 
              id='password_confirmation' 
              name='password_confirmation' 
              type='password' 
              placeholder='retype your password'
              required 
              className='block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-accent1 focus:border-accent1' 
              value={passwordConfirmation} 
              onChange={e => setPasswordConfirmation(e.target.value)} 
              disabled={loading} 
            />
          </div>
          
          <div className="flex gap-4 items-center">
            <button 
              type="button" 
              onClick={() => navigate('/register')}
              className="px-4 bg-white border border-accent1 text-black py-3 rounded-md font-medium hover:bg-accent1/5 transition-colors w-1/3 flex items-center justify-center"
            >
              <ArrowLeft size={18} className="mr-1 text-black  " />
              Back
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="flex-1 bg-accent1 text-white py-3 px-4 rounded-md font-medium flex items-center justify-center gap-2 hover:bg-accent1/90 transition-colors"
            >
              {loading ? 'Signing Up...' : 'Sign Up'}
              {!loading && <ArrowRight size={20} />}
            </button>
          </div>
        </form>
        
        <div className="relative my-6 w-full">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-xs font-medium">
            <span className="bg-white px-4 text-gray-500">Or sign up with</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 w-full">
          <button
            type="button"
            className="flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50"
          >
            <img src="/public/auth/google.svg" alt="Google" className="h-6 w-6" />
          </button>
          <button
            type="button"
            className="flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50"
          >
            <img src="/public/auth/apple.svg" alt="Apple" className="h-6 w-6" />
          </button>
        </div>
      </div>
    </>
  );
};

export default RegisterDetailsPage;
