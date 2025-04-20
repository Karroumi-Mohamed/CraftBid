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
        // Keep the user on Step 1 until they click "Next"
        setError(null);
        setSuccessMessage(null);
    };

    const handleNextStep = () => {
        if (role) {
            setStep(2);
        }
    }

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
                <div className="flex flex-col items-center">
                    <div className="flex flex-col sm:flex-row justify-center items-start gap-8 mb-6">
                        {/* Buyer Option */}
                        <div className="flex flex-col items-center text-center w-48">
                            <button
                                type="button"
                                onClick={() => handleRoleSelect('buyer')}
                                className={`relative border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent2 w-full h-48 overflow-hidden ${role === 'buyer' ? 'ring-2 ring-accent2' : 'border-gray-300'}`}
                            >
                                <img src="/public/auth/buyer.png" className="w-full h-full object-cover" alt="Buyer icon" />
                                {role === 'buyer' && (
                                    <div className="absolute top-2 left-2 w-5 h-5 bg-accent2 rounded-full border-2 border-white flex items-center justify-center">
                                    </div>
                                )}
                            </button>
                            <span className="font-bold block mt-3">Buyer</span>
                        </div>

                        <div className="flex flex-col items-center text-center w-48">
                            <button
                                type="button"
                                onClick={() => handleRoleSelect('artisan')}
                                className={`relative border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent2 w-full h-48 overflow-hidden flex items-center justify-center bg-gray-100 ${role === 'artisan' ? 'ring-2 ring-accent2' : 'border-gray-300'}`}
                            >
                                <img src="/public/auth/artisan.png" className="w-full h-full object-cover" alt="Artisan icon" />
                                {role === 'artisan' && (
                                    <div className="absolute top-2 left-2 w-5 h-5 bg-accent2 rounded-full border-2 border-white flex items-center justify-center">
                                    </div>
                                )}
                            </button>
                            <span className="font-bold block mt-3">Artisan</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleNextStep}
                        disabled={!role}
                        className="py-2 px-6 text-lg font-semibold text-accent1 focus:outline-none  disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer "
                    >
                        Next
                    </button>
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
