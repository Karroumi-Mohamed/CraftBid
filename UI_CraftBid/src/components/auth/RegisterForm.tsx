import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ValidationErrors } from '../../lib/axois';

const RegisterForm: React.FC = () => {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [role, setRole] = useState<'buyer' | 'artisan' | ''>('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<ValidationErrors | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [debugInfo, setDebugInfo] = useState<any>(null);

    useEffect(() => {
        console.log("RegisterForm state:", {
            step,
            role,
            error,
            fieldErrors,
            loading,
            successMessage
        });
    }, [step, role, error, fieldErrors, loading, successMessage]);

    const handleRoleSelect = (selectedRole: 'buyer' | 'artisan') => {
        setRole(selectedRole);
        setError(null);
        setFieldErrors(null);
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
        setFieldErrors(null);
        setSuccessMessage(null);
        setLoading(true);
        setDebugInfo(null);

        if (password !== passwordConfirmation) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }

        const registrationData = {
            name,
            email,
            password,
            password_confirmation: passwordConfirmation,
            role,
        };
        
        console.log("REGISTER FORM: Submitting registration with data:", { 
            ...registrationData, 
            password: "[REDACTED]",
            password_confirmation: "[REDACTED]" 
        });
        
        try {
            const response = await register(registrationData);
            
            setDebugInfo(response);
            
            console.log("REGISTER FORM: Complete response from register:", {
                success: response.success,
                status: response.status,
                data: response.data,
                error: response.error
            });
            
            setLoading(false);
            
            if (response.success === true && response.data) {
                console.log("REGISTER FORM: Registration successful, showing success message");
                setSuccessMessage(response.data?.message || 'Registration successful! Please check your email to verify.');
                setName('');
                setEmail('');
                setPassword('');
                setPasswordConfirmation('');
                setStep(3);
            } else {
                console.error("REGISTER FORM: Registration failed:", response.error);
                
                if (response.status === 422 && response.error?.errors) {
                    console.log("REGISTER FORM: Validation errors detected:", response.error.errors);
                    setFieldErrors(response.error.errors);
                    setError("Please correct the errors below.");
                } else {
                    setError(response.error?.message || 'An error occurred during registration.');
                }
            }
        } catch (e) {
            console.error("REGISTER FORM: Unexpected error during registration:", e);
            setLoading(false);
            setError("An unexpected error occurred. Please try again.");
        }
    };

    return (
        <div>
            {process.env.NODE_ENV === 'development' && debugInfo && (
                <details className="mb-4 p-2 border rounded">
                    <summary className="font-bold text-xs">Debug Info (Dev Only)</summary>
                    <pre className="text-xs mt-2 overflow-auto max-h-40">
                        {JSON.stringify({
                            success: debugInfo.success,
                            status: debugInfo.status,
                            error: debugInfo.error
                        }, null, 2)}
                    </pre>
                </details>
            )}

            {error && step === 2 && (
                <div className="text-red-500 bg-red-100 p-3 rounded mb-4 text-sm">{error}</div>
            )}

            {step === 1 && (
                <div className="flex flex-col items-center mt-10">
                    <div className="flex flex-col sm:flex-row justify-center items-start gap-16">
                        <div className="flex flex-col items-center text-center w-40">
                            <button
                                type="button"
                                onClick={() => handleRoleSelect('buyer')}
                                className={`relative border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent2 w-full h-44 overflow-hidden ${role === 'buyer' ? 'ring-2 ring-accent2' : 'border-gray-300'}`}
                            >
                                <img src="/public/auth/buyer.png" className="w-full h-full object-cover" alt="Buyer icon" />
                                {role === 'buyer' && (
                                    <div className="absolute top-2 left-2 w-5 h-5 bg-accent2 rounded-full border-4 border-black flex items-center justify-center">
                                    </div>
                                )}
                            </button>
                            <span className="font-bold block mt-3">Buyer</span>
                        </div>

                        <div className="flex flex-col items-center text-center w-40">
                            <button
                                type="button"
                                onClick={() => handleRoleSelect('artisan')}
                                className={`relative border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent2 w-full h-44 overflow-hidden flex items-center justify-center bg-gray-100 ${role === 'artisan' ? 'ring-2 ring-accent2' : 'border-gray-300'}`}
                            >
                                <img src="/public/auth/artisan.png" className="w-full h-full object-cover" alt="Artisan icon" />
                                {role === 'artisan' && (
                                    <div className="absolute top-2 left-2 w-5 h-5 bg-accent2 rounded-full border-4 border-black flex items-center justify-center">
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
                        className="py-2 px-6 text-lg font-semibold text-black focus:outline-none  disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer "
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
                        <input 
                            id="name" 
                            name="name" 
                            type="text" 
                            required 
                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 sm:text-sm ${fieldErrors?.name ? 'border-red-500' : 'border-gray-300'}`}
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            disabled={loading} 
                        />
                        {fieldErrors?.name && <p className="text-red-500 text-xs mt-1">{fieldErrors.name[0]}</p>}
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                        <input 
                            id="email" 
                            name="email" 
                            type="email" 
                            autoComplete="email" 
                            required 
                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 sm:text-sm ${fieldErrors?.email ? 'border-red-500' : 'border-gray-300'}`}
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            disabled={loading} 
                        />
                        {fieldErrors?.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email[0]}</p>}
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                        <input 
                            id="password" 
                            name="password" 
                            type="password" 
                            required 
                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 sm:text-sm ${fieldErrors?.password ? 'border-red-500' : 'border-gray-300'}`}
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            disabled={loading} 
                        />
                        {fieldErrors?.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password[0]}</p>}
                    </div>
                    <div>
                        <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700">Confirm Password</label>
                        <input 
                            id="password_confirmation" 
                            name="password_confirmation" 
                            type="password" 
                            required 
                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 sm:text-sm ${fieldErrors?.password_confirmation ? 'border-red-500' : 'border-gray-300'}`}
                            value={passwordConfirmation} 
                            onChange={(e) => setPasswordConfirmation(e.target.value)} 
                            disabled={loading} 
                        />
                        {fieldErrors?.password_confirmation && <p className="text-red-500 text-xs mt-1">{fieldErrors.password_confirmation[0]}</p>}
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
