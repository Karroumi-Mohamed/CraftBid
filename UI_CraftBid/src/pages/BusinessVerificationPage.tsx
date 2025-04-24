import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Mail, UploadCloud, RefreshCw, ClipboardList } from 'lucide-react';
import LogoutButton from '../components/auth/LogoutButton';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import api, { makeRequest } from '../lib/axois';

type EmailVerificationStatus = 'not_started' | 'sent' | 'completed';
type IdVerificationStatus = 'not_started' | 'pending' | 'confirmed' | 'rejected';
type ProfileCompletionStatus = 'pending' | 'completed';

interface VerificationStatusResponse {
    role: 'buyer' | 'artisan';
    emailStatus: EmailVerificationStatus;
    idStatus: IdVerificationStatus | null;
    hasArtisanProfile: boolean | null;
}

const BusinessVerificationPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, isLoading: authLoading } = useAuth();

    const [userRole, setUserRole] = useState<'buyer' | 'artisan' | 'admin' | null>(
        user?.roles?.[0]?.name as 'buyer' | 'artisan' | 'admin' | null ?? null
    );
    const [emailVerificationStatus, setEmailVerificationStatus] = useState<EmailVerificationStatus>(
        user?.email_verified_at ? 'completed' : 'not_started'
    );
    const [idVerificationStatus, setIdVerificationStatus] = useState<IdVerificationStatus>('not_started');
    const [profileCompletionStatus, setProfileCompletionStatus] = useState<ProfileCompletionStatus>('pending');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
    const [resendError, setResendError] = useState<string | null>(null);

    const displayEmail = user?.email || 'your email';

    useEffect(() => {
        const fetchVerificationStatus = async () => {
            if (authLoading) return;

            if (!user) {
                navigate('/login', { state: { message: 'Please log in.' } });
                return;
            }

            const currentUserRole = user.roles?.[0]?.name as 'buyer' | 'artisan' | 'admin' | null;
            setUserRole(currentUserRole);

            if (currentUserRole === 'admin') {
                if (user.email_verified_at) {
                    navigate('/admin');
                    setIsLoading(false);
                    return;
                } else {
                    setEmailVerificationStatus('not_started');
                    setProfileCompletionStatus('completed');
                    setIdVerificationStatus('not_started');
                    setIsLoading(false);
                    return;
                }
            }

            setIsLoading(true);
            setError(null);
            try {
                const response = await makeRequest<VerificationStatusResponse>(api.get('/user/verification-status'));

                if (response.success && response.data) {
                    const { role: apiRole, emailStatus, idStatus, hasArtisanProfile } = response.data;

                    setEmailVerificationStatus(emailStatus);

                    if (apiRole === 'artisan') {
                        setIdVerificationStatus(idStatus ?? 'not_started');
                        setProfileCompletionStatus(hasArtisanProfile ? 'completed' : 'pending');
                    } else {
                        setIdVerificationStatus('not_started');
                        setProfileCompletionStatus('completed');
                    }
                } else {
                    setError(response.error?.message || 'Failed to fetch verification status.');
                    setEmailVerificationStatus(user.email_verified_at ? 'completed' : 'not_started');
                    setIdVerificationStatus('not_started');
                    setProfileCompletionStatus(currentUserRole === 'artisan' ? 'pending' : 'completed');

                    if (response.status === 401) {
                        navigate('/login', { state: { message: 'Session expired. Please log in again.' } });
                    }
                }
            } catch (err) {
                setError('An unexpected error occurred.');
                setEmailVerificationStatus(user.email_verified_at ? 'completed' : 'not_started');
                setIdVerificationStatus('not_started');
                setProfileCompletionStatus(currentUserRole === 'artisan' ? 'pending' : 'completed');
            } finally {
                setIsLoading(false);
            }
        };

        if (!authLoading) {
            fetchVerificationStatus();
        }
    }, [authLoading, user, navigate]);

    const handleResendEmail = async () => {
        const emailToResend = user?.email;
        if (!emailToResend) {
            setResendError("Could not determine email.");
            return;
        }
        setResendStatus('sending');
        setResendError(null);
        const response = await makeRequest<{ message: string }>(api.post('/auth/resend-verification-email', { email: emailToResend }));

        if (response.success) {
            setResendStatus('sent');
            setEmailVerificationStatus('sent');
        } else {
            setResendError(response.error?.message || "Failed to send email.");
            setResendStatus('error');
        }
    };
    const handleContinue = () => {
        if (userRole === 'admin' && emailVerificationStatus === 'completed') {
            navigate('/admin/dashboard');
        } else {
            navigate('/dashboard');
        }
    };
    const handleCompleteProfile = () => {
        navigate('/register/artisan-details', { state: { userId: user?.id } });
    };
    const handleUploadDocuments = () => {
        navigate('/upload-id');
    };

    const isArtisan = userRole === 'artisan';
    const isAdmin = userRole === 'admin';
    const isEmailVerified = emailVerificationStatus === 'completed';
    const isProfileComplete = profileCompletionStatus === 'completed';
    const isIdVerified = idVerificationStatus === 'confirmed';

    const canContinue = isEmailVerified && (isAdmin || !isArtisan || (isProfileComplete && isIdVerified));

    const getStatusText = (section: 'email' | 'id' | 'profile', status: EmailVerificationStatus | IdVerificationStatus | ProfileCompletionStatus): string => {
        if (section === 'email') {
            switch (status) {
                case 'sent':
                    return 'Pending';
                case 'completed':
                    return 'Completed';
                default:
                    return '';
            }
        } else if (section === 'id') {
            switch (status) {
                case 'pending':
                    return 'Pending';
                case 'confirmed':
                    return 'Completed';
                case 'rejected':
                    return 'Rejected';
                default:
                    return '';
            }
        } else if (section === 'profile') {
            switch (status) {
                case 'completed':
                    return 'Completed';
                default:
                    return '';
            }
        }
        return '';
    };

    const getStatusDescription = (section: 'email' | 'id' | 'profile', status: EmailVerificationStatus | IdVerificationStatus | ProfileCompletionStatus): string => {
        if (section === 'email') {
            switch (status) {
                case 'not_started':
                    return 'Verify your email address to proceed.';
                case 'sent':
                    return `A verification link was sent to ${displayEmail}. Check your inbox/spam.`;
                case 'completed':
                    return 'Your email address has been verified.';
                default:
                    return 'Status description goes here.';
            }
        } else if (section === 'id') {
            switch (status) {
                case 'not_started':
                    return 'Upload your ID document for verification.';
                case 'pending':
                    return 'Your ID is currently under review.';
                case 'confirmed':
                    return 'Your ID has been verified.';
                case 'rejected':
                    return 'Your ID verification failed. Please try again.';
                default:
                    return 'Status description goes here.';
            }
        } else if (section === 'profile') {
            switch (status) {
                case 'pending':
                    return 'Please complete your artisan profile with your business details.';
                case 'completed':
                    return 'Your artisan profile details have been saved.';
                default:
                    return 'Status description goes here.';
            }
        }
        return 'Status description goes here.';
    };

    if (authLoading || isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading account status...</div>;
    }

    return (
        <div className="min-h-screen bg-white flex flex-col w-full">
            <div className="flex justify-between items-center p-5 w-full">
                <Link to="/" className="pl-2">
                    <img src="/logo.png" className="h-10" alt="CraftBid Logo" />
                </Link>
                <div className="flex items-center">
                    {user && <LogoutButton />}
                    {!user && (
                        <Link to="/login">
                            <Button variant="link" className="text-accent1">
                                Sign In
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center w-full px-6">
                <div className="w-full max-w-md mx-auto relative">
                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-4 mb-6">
                        {(() => {
                            const status = emailVerificationStatus;
                            const stateSuffix = status === 'completed' ? 'verified' : status === 'sent' ? 'pending' : 'not_started';
                            const statusText = getStatusText('email', status);
                            const description = getStatusDescription('email', status);
                            const isVerified = status === 'completed';

                            return (
                                <div
                                    className={`
                                    border rounded-lg p-5 flex items-start gap-4 w-full transition-colors duration-300 ease-in-out
                                    ${stateSuffix === 'verified' ? 'bg-[#E0F2F1] border-[#4DB6AC]' : ''}
                                    ${stateSuffix === 'pending' ? 'bg-[#F3E5F5] border-[#AB47BC]' : ''}
                                    ${stateSuffix === 'not_started' ? 'bg-white border-[#DEE2E6]' : ''}
                                `}
                                >
                                    <div className="flex-shrink-0 pt-px">
                                        <div
                                            className={`
                                            w-8 h-8 rounded-full flex justify-center items-center transition-colors duration-300 ease-in-out
                                            ${stateSuffix === 'verified' ? 'bg-[#4DB6AC]' : ''}
                                            ${stateSuffix === 'pending' ? 'bg-[#AB47BC]' : ''}
                                            ${stateSuffix === 'not_started' ? 'bg-[#B0BEC5]' : ''}
                                        `}
                                        ></div>
                                    </div>
                                    <div className="flex-grow flex flex-col">
                                        <h2 className="text-base font-medium mb-px text-[#212529] leading-snug">Email Verification</h2>
                                        <p
                                            className={`text-sm mb-1 leading-snug ${
                                                stateSuffix === 'verified' ? 'text-[#00796B]' : 'text-[#6C757D]'
                                            }`}
                                        >
                                            {description}
                                        </p>
                                        {statusText && (
                                            <span
                                                className={`text-sm font-medium block ${
                                                    stateSuffix === 'verified' ? 'text-[#00796B]' : ''
                                                } ${stateSuffix === 'pending' ? 'text-[#8E24AA]' : ''}`}
                                            >
                                                {statusText}
                                            </span>
                                        )}
                                        {!isVerified && (
                                            <div className="mt-2 flex items-center gap-3">
                                                {(status === 'sent' || status === 'not_started') && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={handleResendEmail}
                                                        disabled={resendStatus === 'sending' || resendStatus === 'sent'}
                                                        className="text-xs px-3 py-1.5 h-auto border-[#ced4da] hover:bg-[#f8f9fa] hover:border-[#adb5bd] text-[#212529]"
                                                    >
                                                        {resendStatus === 'sending' ? (
                                                            <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                                                        ) : null}
                                                        {resendStatus === 'sending'
                                                            ? 'Sending...'
                                                            : resendStatus === 'sent'
                                                            ? 'Sent!'
                                                            : status === 'not_started'
                                                            ? 'Send Email'
                                                            : 'Resend Email'}
                                                    </Button>
                                                )}
                                                {resendStatus === 'sent' && (
                                                    <span className="text-sm text-green-600">Verification email sent.</span>
                                                )}
                                                {resendStatus === 'error' && (
                                                    <span className="text-sm text-red-600">{resendError || 'Failed.'}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}

                        {isArtisan &&
                            (() => {
                                const status = profileCompletionStatus;
                                const stateSuffix = status === 'completed' ? 'verified' : 'pending';
                                const statusText = getStatusText('profile', status);
                                const description = getStatusDescription('profile', status);
                                const isComplete = status === 'completed';

                                return (
                                    <div
                                        className={`
                                    border rounded-lg p-5 flex items-start gap-4 w-full transition-colors duration-300 ease-in-out
                                    ${stateSuffix === 'verified' ? 'bg-[#E0F2F1] border-[#4DB6AC]' : ''}
                                    ${stateSuffix === 'pending' ? 'bg-[#F3E5F5] border-[#AB47BC]' : ''}
                                `}
                                    >
                                        <div className="flex-shrink-0 pt-px">
                                            <div
                                                className={`
                                            w-8 h-8 rounded-full flex justify-center items-center transition-colors duration-300 ease-in-out
                                            ${stateSuffix === 'verified' ? 'bg-[#4DB6AC]' : ''}
                                            ${stateSuffix === 'pending' ? 'bg-[#AB47BC]' : ''}
                                        `}
                                            ></div>
                                        </div>
                                        <div className="flex-grow flex flex-col">
                                            <h2 className="text-base font-medium mb-px text-[#212529] leading-snug">Artisan Profile</h2>
                                            <p
                                                className={`text-sm mb-1 leading-snug ${
                                                    stateSuffix === 'verified' ? 'text-[#00796B]' : 'text-[#6C757D]'
                                                }`}
                                            >
                                                {description}
                                            </p>
                                            {statusText && (
                                                <span
                                                    className={`text-sm font-medium block ${
                                                        stateSuffix === 'verified' ? 'text-[#00796B]' : ''
                                                    } ${stateSuffix === 'pending' ? 'text-[#8E24AA]' : ''}`}
                                                >
                                                    {statusText}
                                                </span>
                                            )}
                                            {!isComplete && (
                                                <div className="mt-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={handleCompleteProfile}
                                                        className="text-xs px-3 py-1.5 h-auto border-[#ced4da] hover:bg-[#f8f9fa] hover:border-[#adb5bd] text-[#212529]"
                                                    >
                                                        Complete Profile
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}

                        {isArtisan &&
                            isProfileComplete &&
                            (() => {
                                const status = idVerificationStatus;
                                const stateSuffix = status === 'confirmed' ? 'verified' : status;
                                const statusText = getStatusText('id', status);
                                const description = getStatusDescription('id', status);
                                const needsAction = status === 'not_started' || status === 'rejected';

                                return (
                                    <div
                                        className={`
                                    border rounded-lg p-5 flex items-start gap-4 w-full transition-colors duration-300 ease-in-out
                                    ${stateSuffix === 'verified' ? 'bg-[#E0F2F1] border-[#4DB6AC]' : ''}
                                    ${stateSuffix === 'pending' ? 'bg-[#F3E5F5] border-[#AB47BC]' : ''}
                                    ${stateSuffix === 'rejected' ? 'bg-[#FFEBEE] border-[#EF5350]' : ''}
                                    ${stateSuffix === 'not_started' ? 'bg-white border-[#DEE2E6]' : ''}
                                `}
                                    >
                                        <div className="flex-shrink-0 pt-px">
                                            <div
                                                className={`
                                            w-8 h-8 rounded-full flex justify-center items-center transition-colors duration-300 ease-in-out
                                            ${stateSuffix === 'verified' ? 'bg-[#4DB6AC]' : ''}
                                            ${stateSuffix === 'pending' ? 'bg-[#AB47BC]' : ''}
                                            ${stateSuffix === 'rejected' ? 'bg-[#EF5350]' : ''}
                                            ${stateSuffix === 'not_started' ? 'bg-[#B0BEC5]' : ''}
                                        `}
                                            ></div>
                                        </div>
                                        <div className="flex-grow flex flex-col">
                                            <h2 className="text-base font-medium mb-px text-[#212529] leading-snug">ID Verification</h2>
                                            <p
                                                className={`text-sm mb-1 leading-snug ${
                                                    stateSuffix === 'verified'
                                                        ? 'text-[#00796B]'
                                                        : stateSuffix === 'rejected'
                                                        ? 'text-[#D32F2F]'
                                                        : 'text-[#6C757D]'
                                                }`}
                                            >
                                                {description}
                                            </p>
                                            {statusText && (
                                                <span
                                                    className={`text-sm font-medium block ${
                                                        stateSuffix === 'verified' ? 'text-[#00796B]' : ''
                                                    } ${stateSuffix === 'pending' ? 'text-[#8E24AA]' : ''} ${
                                                        stateSuffix === 'rejected' ? 'text-[#D32F2F]' : ''
                                                    }`}
                                                >
                                                    {statusText}
                                                </span>
                                            )}
                                            {needsAction && (
                                                <div className="mt-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={handleUploadDocuments}
                                                        className="text-xs px-3 py-1.5 h-auto border-[#ced4da] hover:bg-[#f8f9fa] hover:border-[#adb5bd] text-[#212529]"
                                                    >
                                                        {status === 'rejected' ? 'Re-upload ID' : 'Upload ID'}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}
                    </div>

                    <div className="mt-8 mb-4 w-full">
                        <Button
                            onClick={handleContinue}
                            disabled={!canContinue}
                            className="w-full bg-accent1 text-white py-3 px-4 rounded-md font-medium flex items-center justify-center gap-2 hover:bg-accent1/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Continue to Dashboard
                            <ArrowRight size={20} />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BusinessVerificationPage;
