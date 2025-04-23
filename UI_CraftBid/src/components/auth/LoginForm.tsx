import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { ValidationErrors } from "../../lib/axois"; // Keep this for type casting API errors
import { InputWithError } from "../ui/InputWithError"; // Import the custom input component
// Removed PasswordInput import as InputWithError handles password type

// Define error state type for login - simple key-value pairs with string messages
interface LoginErrors {
    email?: string;
    password?: string;
    general?: string; // For non-field specific errors like "auth.failed"
}

export default function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    // Use the corrected LoginErrors type for state
    const [errors, setErrors] = useState<LoginErrors>({});

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({}); // Clear previous errors
        setLoading(true);

        const response = await login({ email, password });
        setLoading(false);

        if (response.success) {
            const from = (location.state as any)?.from?.pathname || '/'; // Redirect to intended page or home
            navigate(from, { replace: true });
        } else if (response.verificationRequired) {
            // Navigate to status page if email verification is needed
            const userRole = 'buyer'; // Assuming buyer if role unknown, adjust as needed
            navigate(`/status`, {
                replace: true,
                 state: { email: email, role: userRole } // Pass email and assumed role
             });
         // Explicitly check for verificationRequired *before* other errors
         } else if (response.verificationRequired) {
             // This case should ideally be caught by the checkAuthStatus within login,
             // but handle it explicitly here just in case.
             console.log("Login successful but email not verified, redirecting to status.");
             const userRole = 'buyer'; // Assuming buyer if role unknown
             navigate(`/status`, { replace: true, state: { email: email, role: userRole } });
         } else {
             // Handle other login errors (validation, auth failed, server issues)
             console.error('Login error response:', response);
             const errorMessage = response.error?.message || 'Failed to login. Please check your credentials.';

             if (response.status === 422 && response.error?.errors) {
                // Handle validation errors (e.g., email format)
                const apiErrors = response.error.errors as ValidationErrors; // Cast API errors
                const newErrors: LoginErrors = {};
                for (const field in apiErrors) {
                    // Assign the first error message string to the corresponding field
                    if (apiErrors[field] && apiErrors[field].length > 0) {
                        newErrors[field as keyof LoginErrors] = apiErrors[field][0];
                    }
                }
                setErrors(newErrors);
            } else {
                // Handle general errors (e.g., incorrect credentials, server issues)
                // Assign the error message string to the appropriate key
                if (errorMessage.toLowerCase().includes('failed') || response.status === 401) {
                     // Show general auth error near email/password field for better context
                     setErrors({ email: errorMessage });
                } else {
                     setErrors({ general: errorMessage }); // Use general for other errors
                }
            }
        }
    };

    return (
        <div className="w-full mt-5">
            {/* Display general errors */}
            {errors.general && <div className="text-red-500 bg-red-100 p-3 rounded mb-4 text-sm">{errors.general}</div>}

            <form onSubmit={handleSubmit} className="w-full space-y-4">
                {/* Use InputWithError for Email */}
                <InputWithError
                    label="Email"
                    id="email"
                    type="email"
                    placeholder="johndeo@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    error={errors.email} // Pass the email error string (or undefined)
                    autoComplete="email"
                />

                {/* Use InputWithError for Password */}
                <InputWithError
                    label="Password"
                    id="password"
                    type="password" // InputWithError handles the type
                    placeholder="minimum 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    // Pass password error string OR the general auth error if it was assigned to email
                    error={errors.password || (errors.email?.toLowerCase().includes('failed') ? errors.email : undefined)}
                    autoComplete="current-password"
                />

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full cursor-pointer mt-2 bg-accent1 text-white font-semibold text-lg py-3 rounded-md flex items-center justify-center gap-2 hover:bg-accent1/90 transition-colors disabled:opacity-70"
                >
                    {loading ? 'Signing In...' : 'Sign In'}
                    {!loading && <ArrowRight strokeWidth={3} size={16} />}
                </button>
            </form>
        </div>
    );
}
