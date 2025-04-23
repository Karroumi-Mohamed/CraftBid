import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Mail, CheckCircle, XCircle, AlertCircle, UploadCloud, RefreshCw } from 'lucide-react'; // Added RefreshCw
import LogoutButton from '../components/auth/LogoutButton';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import api, { makeRequest, ApiResponse } from '../lib/axois'; // Use the configured api instance

// Define status types based on API response and component logic
type EmailVerificationStatus = 'pending' | 'verified';
type IdVerificationStatus = 'not_required' | 'pending' | 'submitted' | 'verified' | 'rejected';

// Interface for the API response from /user/verification-status
interface VerificationStatusResponse {
    role: 'buyer' | 'artisan';
    emailVerified: boolean;
    idStatus: IdVerificationStatus | null; // Can be null if not an artisan
}

const BusinessVerificationPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    // Get user from AuthContext, but rely on API for definitive status
    const { user, resendVerificationEmail, isLoading: authLoading, checkAuthStatus } = useAuth();
    // Get role/email passed from registration/login if available
    const stateRole = location.state?.role as 'buyer' | 'artisan' | null;
    const stateEmail = location.state?.email as string | null;

    // State for displaying status
    const [userRole, setUserRole] = useState<'buyer' | 'artisan' | null>(stateRole);
    const [emailVerificationStatus, setEmailVerificationStatus] = useState<EmailVerificationStatus>('pending');
    const [idVerificationStatus, setIdVerificationStatus] = useState<IdVerificationStatus>('not_required');
    const [isLoading, setIsLoading] = useState(true); // Loading state for this page's API call
    const [error, setError] = useState<string | null>(null);
    const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
    const [resendError, setResendError] = useState<string | null>(null);

    // Determine the email to display (prefer user context, fallback to state)
    const displayEmail = user?.email || stateEmail || 'your email';

    // Fetch verification status from the API when the component mounts or auth status changes
    useEffect(() => {
        const fetchVerificationStatus = async () => {
             // We need to be authenticated to hit the status endpoint
             // If initial auth check is still running, wait.
             if (authLoading) return;

             // If not authenticated after check, redirect to login
             if (!user && !stateEmail) { // Check if we have neither logged-in user nor email from state
                 navigate('/login', { state: { message: 'Please log in to check your status.' } });
                 return;
             }

            setIsLoading(true);
            setError(null);
            try {
                // Use the actual API endpoint
                const response = await makeRequest<VerificationStatusResponse>(api.get('/user/verification-status'));

                if (response.success && response.data) {
                    const { role: apiRole, emailVerified, idStatus } = response.data;
                    setUserRole(apiRole); // Update role based on API response
                    setEmailVerificationStatus(emailVerified ? 'verified' : 'pending');
                    // Set ID status based on API response, default to 'not_required' if null/buyer
                    setIdVerificationStatus(idStatus ?? 'not_required');
                } else {
                    // Handle errors, e.g., user not authenticated (401), server error (500)
                    setError(response.error?.message || 'Failed to fetch verification status.');
                    // Set default states on error
                    setEmailVerificationStatus('pending');
                    // Try to determine role from context or state as fallback
                    const currentRole = user?.roles?.[0]?.name || stateRole;
                    setIdVerificationStatus(currentRole === 'artisan' ? 'pending' : 'not_required');

                    if (response.status === 401) {
                        // If unauthenticated, redirect to login
                        navigate('/login', { state: { message: 'Session expired. Please log in again to check your status.' } });
                    }
                }
            } catch (err) {
                 console.error("Unexpected error fetching status:", err);
                 setError('An unexpected error occurred while fetching status.');
                 setEmailVerificationStatus('pending');
                 const currentRole = user?.roles?.[0]?.name || stateRole;
                 setIdVerificationStatus(currentRole === 'artisan' ? 'pending' : 'not_required');
            } finally {
                setIsLoading(false);
            }
        };

        // Only run fetchVerificationStatus when authLoading transitions from true to false,
        // or if the user object itself changes (e.g., after email verification happens elsewhere)
        if (!authLoading) {
             fetchVerificationStatus();
        }

    }, [authLoading, user?.id, navigate]); // Depend on authLoading and user ID

    const handleResendEmail = async () => {
        // Use the email determined by displayEmail
        if (!displayEmail || displayEmail === 'your email') {
            setResendError("Could not determine the email address to resend to.");
            setResendStatus('error');
            return;
        }
        setResendStatus('sending');
        setResendError(null);
        // Use the function from AuthContext, passing the correct email
        const response = await resendVerificationEmail({ email: displayEmail });
        if (response.success) {
            setResendStatus('sent');
        } else {
            setResendError(response.error?.message || "Failed to resend email.");
            setResendStatus('error');
        }
    };

    const handleContinue = () => {
        // Navigate to dashboard or appropriate next step
        // Potentially check roles/status again before navigating if needed
        navigate('/dashboard'); // Adjust '/dashboard' to your actual dashboard route
    };

    // Determine if the user is an artisan based on the fetched role
    const isArtisan = userRole === 'artisan';
    const isEmailVerified = emailVerificationStatus === 'verified';
    const isIdVerified = idVerificationStatus === 'verified';
    // const isIdRejected = idVerificationStatus === 'rejected'; // Keep for potential UI logic
    // const isIdPendingReview = idVerificationStatus === 'submitted'; // Keep for potential UI logic

    // Determine overall readiness to continue (Email must be verified, and ID must be verified if artisan)
    const canContinue = isEmailVerified && (!isArtisan || isIdVerified);

    // --- UI Helper Functions --- (Keep these as they are)
    const getStatusIcon = (status: EmailVerificationStatus | IdVerificationStatus) => {
        switch (status) {
            case 'verified': return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'rejected': return <XCircle className="h-5 w-5 text-red-500" />;
            case 'pending':
            case 'submitted':
            case 'not_required': // Treat as pending/neutral visually if shown
            default: return <AlertCircle className="h-5 w-5 text-yellow-500" />;
        }
    };

    const getStatusColorClass = (status: EmailVerificationStatus | IdVerificationStatus) => {
        switch (status) {
            case 'verified': return 'border-green-500/30 bg-green-500/5 text-green-700';
            case 'rejected': return 'border-red-500/30 bg-red-500/5 text-red-700';
            case 'pending':
            case 'submitted':
            case 'not_required':
            default: return 'border-yellow-500/30 bg-yellow-500/5 text-yellow-700';
        }
    };

    const getStatusLabel = (status: EmailVerificationStatus | IdVerificationStatus): string => {
        switch (status) {
            case 'verified': return 'Verified';
            case 'rejected': return 'Rejected';
            case 'pending': return 'Pending Action';
            case 'submitted': return 'Pending Review';
            case 'not_required': return 'Not Required';
            default: return 'Unknown';
        }
    };
    // --- End UI Helper Functions ---

    // Display loading indicator while fetching status or initial auth check is running
    if (authLoading || isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading verification status...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col w-full">
            {/* Header */}
            <div className='flex justify-between items-center p-4 w-full border-b bg-white'>
                <Link to="/" className='pl-2'>
                    {/* Ensure logo path is correct */}
                    <img src="/logo.png" className="h-8" alt="CraftBid" />
                </Link>
                {/* Show logout only if user context exists (implies logged in) */}
                {user && <LogoutButton />}
            </div>

            <div className="flex-1 flex flex-col items-center w-full py-8 px-4">
                <div className="w-full max-w-lg bg-white p-6 md:p-8 rounded-lg shadow-md">
                    <h1 className="text-2xl font-semibold text-center mb-2 text-gray-800">Account Status</h1>
                    <p className="text-gray-600 text-center mb-6">
                        {isArtisan
                            ? "Verify your email and identity to start selling on CraftBid."
                            : "Please verify your email to access all CraftBid features."
                        }
                    </p>

                    {/* Display general API errors */}
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Email Verification Block */}
                    <div className={`border rounded-md mb-4 p-4 ${getStatusColorClass(emailVerificationStatus)}`}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Mail className="h-5 w-5" />
                                <h3 className="font-semibold text-base">Email Verification</h3>
                            </div>
                            <div className="flex items-center gap-1 text-sm font-medium">
                                {getStatusIcon(emailVerificationStatus)}
                                <span>{getStatusLabel(emailVerificationStatus)}</span>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                            {isEmailVerified
                                ? `Your email (${displayEmail}) is verified.`
                                : `A verification link has been sent to ${displayEmail}. Please check your inbox (and spam folder).`
                            }
                        </p>
                        {/* Show resend button only if email is pending */}
                        {!isEmailVerified && (
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleResendEmail}
                                    disabled={resendStatus === 'sending' || resendStatus === 'sent'}
                                >
                                    {resendStatus === 'sending' ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    {resendStatus === 'sending' ? 'Sending...' : resendStatus === 'sent' ? 'Sent!' : 'Resend Email'}
                                </Button>
                                {resendStatus === 'sent' && <span className="text-sm text-green-600">Verification email sent successfully.</span>}
                                {resendStatus === 'error' && <span className="text-sm text-red-600">{resendError || 'Failed to resend.'}</span>}
                            </div>
                        )}
                    </div>

                    {/* ID Verification Block (Artisans Only) */}
                    {isArtisan && (
                        <div className={`border rounded-md mb-4 p-4 ${getStatusColorClass(idVerificationStatus)}`}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <UploadCloud className="h-5 w-5" />
                                    <h3 className="font-semibold text-base">Identity Verification</h3>
                                </div>
                                <div className="flex items-center gap-1 text-sm font-medium">
                                    {getStatusIcon(idVerificationStatus)}
                                    <span>{getStatusLabel(idVerificationStatus)}</span>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">
                                {idVerificationStatus === 'pending' && "Please upload your identification documents to verify your business."}
                                {idVerificationStatus === 'submitted' && "Your documents have been submitted and are under review (usually takes 1-2 business days)."}
                                {idVerificationStatus === 'verified' && "Your identity has been successfully verified."}
                                {idVerificationStatus === 'rejected' && "Your ID verification was rejected. Please check your email or contact support for details."}
                                {idVerificationStatus === 'not_required' && "ID Verification is not required for your account type."}
                            </p>
                            {/* Show upload button only if status is pending or rejected */}
                            {(idVerificationStatus === 'pending' || idVerificationStatus === 'rejected') && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate('/upload-id')} // TODO: Create this route/page
                                >
                                    {idVerificationStatus === 'rejected' ? 'Re-upload Documents' : 'Upload Documents'}
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Continue Button: Enabled only when all required verifications are complete */}
                    <Button
                        onClick={handleContinue}
                        disabled={!canContinue}
                        className="mt-6 w-full"
                        size="lg"
                    >
                        {canContinue ? 'Continue to Dashboard' : 'Verification Pending'}
                        {canContinue && <ArrowRight size={18} className="ml-2" />}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default BusinessVerificationPage;
