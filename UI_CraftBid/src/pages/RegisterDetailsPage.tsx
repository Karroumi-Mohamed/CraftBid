import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, ArrowLeft } from "lucide-react";
import { InputWithError } from '@/components/ui/InputWithError';
import { ValidationErrors } from '@/lib/axois';

interface RegistrationErrors {
  name?: string;
  email?: string;
  password?: string;
  password_confirmation?: string;
  general?: string;
}

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
  const [errors, setErrors] = useState<RegistrationErrors>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    setErrors({});
    setLoading(true);

    if (password !== passwordConfirmation) {
      setErrors(prev => ({ ...prev, password_confirmation: 'Passwords do not match.' }));
      setLoading(false);
      return;
    }

    const response = await register({
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
      role,
    });

    setLoading(false);

    if (response.success) {
      if (role === 'artisan') {
        navigate('/register/artisan-details', { state: { email: email, userId: response.data?.id } });
      } else {
        navigate('/status', { state: { role: role, email: email } });
      }
    } else {
      if (response.error?.errors) {
        const apiErrors = response.error.errors as ValidationErrors;
        const newErrors: RegistrationErrors = {};
        for (const field in apiErrors) {
          if (apiErrors[field] && apiErrors[field].length > 0) {
            newErrors[field as keyof RegistrationErrors] = apiErrors[field][0];
          }
        }
        if (newErrors.password && newErrors.password.toLowerCase().includes('confirmation')) {
          newErrors.password_confirmation = newErrors.password;
          delete newErrors.password;
        }
        setErrors(newErrors);
      } else {
        setErrors({ general: response.error?.message || 'An unexpected error occurred during registration.' });
      }
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

        {errors.general && <div className="text-red-500 bg-red-100 p-3 rounded mb-4 text-sm w-full">{errors.general}</div>}

        <form onSubmit={handleSubmit} className='space-y-5 w-full'>
          <input type='hidden' value={role} name='role' />

          <InputWithError
            id='name'
            name='name'
            type='text'
            label={role === 'artisan' ? 'Business name' : 'Name'}
            placeholder={role === 'artisan' ? 'Your business name' : 'John Doe'}
            required
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={loading}
            error={errors.name}
          />

          <InputWithError
            id='email'
            name='email'
            type='email'
            label='Email'
            placeholder='johndeo@gmail.com'
            autoComplete='email'
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={loading}
            error={errors.email}
          />

          <InputWithError
            id='password'
            name='password'
            type='password'
            label='Password'
            placeholder='minimum 8 characters'
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={loading}
            error={errors.password}
          />

          <InputWithError
            id='password_confirmation'
            name='password_confirmation'
            type='password'
            label='Confirm Password'
            placeholder='retype your password'
            required
            value={passwordConfirmation}
            onChange={e => setPasswordConfirmation(e.target.value)}
            disabled={loading}
            error={errors.password_confirmation}
          />

          <div className="flex gap-4 items-center">
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="px-4 bg-white border border-accent1 text-black py-3 rounded-md font-medium hover:bg-accent1/5 transition-colors w-1/3 flex items-center justify-center"
            >
              <ArrowLeft size={18} className="mr-1 text-black" />
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
