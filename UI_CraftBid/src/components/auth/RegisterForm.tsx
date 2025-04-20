import React, { useState } from 'react';
import axios from 'axios'; // Keep for type checking
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const RegisterForm: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // Step 1: Role selection, Step 2: Details
  const [role, setRole] = useState<'buyer' | 'artisan' | ''>('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (selectedRole: 'buyer' | 'artisan') => {
    setRole(selectedRole);
    setStep(2);
    setError(null); // Clear errors when changing step
    setSuccessMessage(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (step !== 2 || !role) return;

    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    if (password !== passwordConfirmation) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const response = await register({ // Use register function from context
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        role,
      });

      console.log('Registration successful:', response.data);
      setSuccessMessage(response.data.message || 'Registration successful! Please check your email to verify.');
      // Clear form fields after successful registration
      setName('');
      setEmail('');
      setPassword('');
      setPasswordConfirmation('');
      setStep(3); // Move to a success/confirmation step

    } catch (err: any) {
      console.error('Registration error:', err);
       if (axios.isAxiosError(err) && err.response) {
        if (err.response.status === 422) {
           const messages = Object.values(err.response.data.errors || {}).flat().join(' ');
           setError(messages || 'Validation failed.');
        } else {
           setError(err.response.data.message || 'An error occurred during registration.');
        }
      } else if (err instanceof Error) {
           setError(err.message);
       } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && step === 2 && <div className="text-red-500 bg-red-100 p-3 rounded mb-4 text-sm">{error}</div>}

      {step === 1 && (
        <div>
          <h3 className="text-lg font-medium mb-4 text-center text-gray-700">Choose your role to get started</h3>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
              type="button"
              onClick={() => handleRoleSelect('buyer')}
              className="p-6 border rounded-lg text-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-48"
            >
              <span className="text-4xl mb-2 block" role="img" aria-label="Buyer icon">👤</span>
              <span className="font-semibold block">Buyer</span>
              <p className="text-sm text-gray-500 mt-1">Browse and purchase artisan products</p>
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('artisan')}
              className="p-6 border rounded-lg text-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-48"
            >
              <span className="text-4xl mb-2 block" role="img" aria-label="Artisan icon">🏢</span>
              <span className="font-semibold block">Artisan</span>
              <p className="text-sm text-gray-500 mt-1">Sell your handcrafted products</p>
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" value={role} name="role" />
          <h3 className="text-lg font-medium text-gray-700">Enter your details ({role})</h3>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
            <input id="name" name="name" type="text" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
            <input id="email" name="email" type="email" autoComplete="email" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input id="password" name="password" type="password" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
          </div>
          <div>
            <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <input id="password_confirmation" name="password_confirmation" type="password" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} disabled={loading} />
          </div>
          <div className="flex items-center justify-between pt-2">
             <button type="button" onClick={() => setStep(1)} className="text-sm font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50" disabled={loading}>Back to role selection</button>
             <button type="submit" disabled={loading} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
               {loading ? 'Registering...' : 'Create Account'}
             </button>
          </div>
        </form>
      )}

      {step === 3 && (
         <div className="text-center p-4 border rounded-md bg-green-50">
            <h3 className="text-lg font-medium text-green-800">Registration Submitted!</h3>
            <p className="mt-2 text-sm text-green-700">{successMessage || 'Please check your email to verify your account.'}</p>
            <button onClick={() => navigate('/login')} className="mt-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Proceed to Login
            </button>
         </div>
      )}
    </div>
  );
};

export default RegisterForm;
