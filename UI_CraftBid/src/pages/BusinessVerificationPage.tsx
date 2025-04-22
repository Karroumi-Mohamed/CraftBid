import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Mail, CheckCircle, XCircle, AlertCircle, UploadCloud } from 'lucide-react';
import LogoutButton from '../components/auth/LogoutButton';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import api, { makeRequest, ApiResponse } from '../lib/axois';

type EmailVerificationStatus = 'pending' | 'verified';
type IdVerificationStatus = 'not_required' | 'pending' | 'submitted' | 'verified' | 'rejected';

interface ArtisanStatus {
    id_verification_status: IdVerificationStatus;
}

const BusinessVerificationPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isVerified: isEmailVerifiedInitially, resendVerificationEmail, isLoading: authLoading } = useAuth();
    const queryParams = new URLSearchParams(location.search);
    const role = queryParams.get('role') as 'buyer' | 'artisan' | null;
    const stateEmail = location.state?.email;

    const [emailVerificationStatus, setEmailVerificationStatus] = useState<EmailVerificationStatus>(isEmailVerifiedInitially ? 'verified' : 'pending');
    const [idVerificationStatus, setIdVerificationStatus] = useState<IdVerificationStatus>('not_required');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
    const [resendError, setResendError] = useState<string | null>(null);

    const isArtisan = role === 'artisan';
    const displayEmail = user?.email || stateEmail || 'your email';

    useEffect(() => {
        const fetchArtisanStatus = async () => {
            if (isArtisan && user?.id) {
                setIsLoading(true);
                setError(null);
                try {
                    const response: ApiResponse<ArtisanStatus> = await new Promise(resolve => setTimeout(() => resolve({
                        success: true,
                        data: { id_verification_status: 'pending' },
                        status: 200,
                        error: null
                    }), 500));

                    if (response.success && response.data) {
                        setIdVerificationStatus(response.data.id_verification_status);
                    } else {
                        setError(response.error?.message || 'Failed to fetch ID verification status.');
                        setIdVerificationStatus('pending');
                    }
                } catch (err) {
                    console.error("Error fetching artisan status:", err);
                    setError('An unexpected error occurred while fetching ID status.');
                    setIdVerificationStatus('pending');
                } finally {
                    setIsLoading(false);
                }
            } else {
                setIdVerificationStatus('not_required');
                setIsLoading(false);
            }
        };

        setEmailVerificationStatus(isEmailVerifiedInitially ? 'verified' : 'pending');

        if (!authLoading) {
            fetchArtisanStatus();
        }

    }, [isArtisan, user, authLoading, isEmailVerifiedInitially]);

    const handleResendEmail = async () => {
        if (!displayEmail || displayEmail === 'your email') {
            setResendError("Could not determine the email address to resend to.");
            setResendStatus('error');
            return;
        }
        setResendStatus('sending');
        setResendError(null);
        const response = await resendVerificationEmail({ email: displayEmail });
        if (response.success) {
            setResendStatus('sent');
        } else {
            setResendError(response.error?.message || "Failed to resend email.");
            setResendStatus('error');
        }
    };

    const handleContinue = () => {
        navigate('/dashboard');
    };

    const isEmailVerified = emailVerificationStatus === 'verified';
    const isIdVerified = idVerificationStatus === 'verified';
    const isIdRejected = idVerificationStatus === 'rejected';
    const isIdPendingReview = idVerificationStatus === 'submitted';

    const canContinue = isEmailVerified && (!isArtisan || isIdVerified);

    const getStatusIcon = (status: EmailVerificationStatus | IdVerificationStatus) => {
        switch (status) {
            case 'verified': return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'rejected': return <XCircle className="h-5 w-5 text-red-500" />;
            case 'pending':
            case 'submitted':
            case 'not_required':
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

    if (authLoading || isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading verification status...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col w-full">
            <div className='flex justify-between items-center p-4 w-full border-b bg-white'>
                <Link to="/" className='pl-2'>
                    <img src="/logo.png" className="h-8" alt="CraftBid" />
                </Link>
                <LogoutButton />
            </div>

            <div className="flex-1 flex flex-col items-center w-full py-8 px-4">
                <div className="w-full max-w-lg bg-white p-6 md:p-8 rounded-lg shadow-md">
                    <h1 className="text-2xl font-semibold text-center mb-2 text-gray-800">Complete Your Account Setup</h1>
                    <p className="text-gray-600 text-center mb-6">
                        {isArtisan
                            ? "Verify your email and identity to start selling on CraftBid."
                            : "Please verify your email to access all CraftBid features."
                        }
                    </p>

                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

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
                        {!isEmailVerified && (
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleResendEmail}
                                    disabled={resendStatus === 'sending' || resendStatus === 'sent'}
                                >
                                    {resendStatus === 'sending' ? 'Sending...' : resendStatus === 'sent' ? 'Sent!' : 'Resend Email'}
                                </Button>
                                {resendStatus === 'sent' && <span className="text-sm text-green-600">Verification email sent successfully.</span>}
                                {resendStatus === 'error' && <span className="text-sm text-red-600">{resendError || 'Failed to resend.'}</span>}
                            </div>
                        )}
                    </div>

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
                                {idVerificationStatus === 'submitted' && "Your documents have been submitted and are under review."}
                                {idVerificationStatus === 'verified' && "Your identity has been successfully verified."}
                                {idVerificationStatus === 'rejected' && "Your ID verification was rejected. Please check your email or contact support."}
                            </p>
                            {(idVerificationStatus === 'pending' || idVerificationStatus === 'rejected') && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate('/upload-id')}
                                >
                                    {idVerificationStatus === 'rejected' ? 'Re-upload Documents' : 'Upload Documents'}
                                </Button>
                            )}
                        </div>
                    )}

                    <Button
                        onClick={handleContinue}
                        disabled={!canContinue || isLoading || authLoading}
                        className="mt-6 w-full"
                        size="lg"
                    >
                        {canContinue ? 'Continue to Dashboard' : 'Verification Pending'}
                        {!canContinue && <ArrowRight size={18} className="ml-2" />}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default BusinessVerificationPage;
