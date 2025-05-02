import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, RefreshCw } from 'lucide-react';
import LogoutButton from '../components/auth/LogoutButton';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import api, { makeRequest } from '../lib/axois';

const BusinessVerificationPage: React.FC = () => {
    const navigate = useNavigate();
    const { 
        user, 
        isLoading: authLoading,
        isVerified,
        emailVerificationStatus,
        idVerificationStatus,
        profileCompletionStatus,
        resendVerificationEmail
    } = useAuth();

    const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
    const [resendError, setResendError] = useState<string | null>(null);

    const userRole = user?.roles?.[0]?.name as 'buyer' | 'artisan' | 'admin' | undefined;
    const displayEmail = user?.email || 'your email';

    React.useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login', { replace: true, state: { message: 'Please log in.' } });
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
        const response = await resendVerificationEmail({ email: emailToResend });

        if (response.success) {
            setResendStatus('sent');
        } else {
            setResendError(response.error?.message || "Failed to send email.");
            setResendStatus('error');
        }
    };

    const handleContinue = () => {
        const dashboardPath = userRole === 'admin' ? '/admin/' : '/dashboard';
        navigate(dashboardPath);
    };

    const handleCompleteProfile = () => {
        navigate('/register/artisan-details', { state: { userId: user?.id } });
    };
    const handleUploadDocuments = () => {
        navigate('/upload-id');
    };

    const isArtisan = userRole === 'artisan';

    const getStatusText = (section: 'email' | 'id' | 'profile'): string => {
        const status = section === 'email' ? emailVerificationStatus 
                     : section === 'id' ? idVerificationStatus 
                     : profileCompletionStatus;

        if (section === 'email') {
            switch (status) {
                case 'sent': return 'Pending';
                case 'completed': return 'Completed';
                default: return '';
            }
        } else if (section === 'id') {
            switch (status) {
                case 'pending': return 'Pending Review';
                case 'confirmed': return 'Completed';
                case 'rejected': return 'Rejected';
                case 'not_started': return 'Action Required';
                default: return '';
            }
        } else if (section === 'profile') {
             switch (status) {
                case 'completed': return 'Completed';
                case 'pending': return 'Action Required';
                default: return '';
            }
        }
        return '';
    };

    const getStatusDescription = (section: 'email' | 'id' | 'profile'): string => {
         const status = section === 'email' ? emailVerificationStatus 
                     : section === 'id' ? idVerificationStatus 
                     : profileCompletionStatus;

        if (section === 'email') {
            switch (status) {
                case 'not_started': return 'Verify your email address to proceed.';
                case 'sent': return `A verification link was sent to ${displayEmail}. Check your inbox/spam.`;
                case 'completed': return 'Your email address has been verified.';
                default: return 'Checking email status...';
            }
        } else if (section === 'id') {
            switch (status) {
                case 'not_started': return 'Upload your ID document for verification.';
                case 'pending': return 'Your ID is currently under review (usually takes 1-2 business days).';
                case 'confirmed': return 'Your ID has been verified.';
                case 'rejected': return 'Your ID verification failed. Please review the reason and try again.';
                default: return 'ID verification applies to artisans only.';
            }
        } else if (section === 'profile') {
            switch (status) {
                case 'pending': return 'Complete your artisan profile with your business details.';
                case 'completed': return 'Your artisan profile details have been saved.';
                default: return 'Profile completion applies to artisans only.';
            }
        }
        return 'Loading status...';
    };

    if (authLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading account status...</div>;
    }

    if (!user) {
         return <div className="min-h-screen flex items-center justify-center">Redirecting to login...</div>;
    }

    return (
        <div className="min-h-screen bg-white flex flex-col w-full">
            <div className="flex justify-between items-center p-5 w-full">
                <Link to="/" className="pl-2">
                    <img src="/logo.png" className="h-10" alt="CraftBid Logo" />
                </Link>
                <div className="flex items-center">
                    {user && <LogoutButton />}
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center w-full px-6">
                <div className="w-full max-w-md mx-auto relative">
                    <h1 className="text-2xl font-bold text-center mb-2">Account Verification</h1>
                    <p className="text-center text-gray-600 mb-6">Complete the following steps to activate your account.</p>

                    <div className="space-y-4 mb-6">
                        {(() => {
                            const status = emailVerificationStatus;
                            const stateSuffix = status === 'completed' ? 'verified' : status === 'sent' ? 'pending' : 'not_started';
                            const statusText = getStatusText('email');
                            const description = getStatusDescription('email');
                            const isComplete = status === 'completed';

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
                                            className={`text-sm mb-1 leading-snug ${stateSuffix === 'verified' ? 'text-[#00796B]' : 'text-[#6C757D]'}`}
                                        >
                                            {description}
                                        </p>
                                        {statusText && (
                                            <span
                                                className={`text-sm font-medium block ${stateSuffix === 'verified' ? 'text-[#00796B]' : ''} ${stateSuffix === 'pending' ? 'text-[#8E24AA]' : ''}`}
                                            >
                                                {statusText}
                                            </span>
                                        )}
                                        {!isComplete && (
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
                                const stateSuffix = status === 'completed' ? 'verified' : status === 'pending' ? 'pending' : 'not_applicable';
                                const statusText = getStatusText('profile');
                                const description = getStatusDescription('profile');
                                const isComplete = status === 'completed';

                                return (
                                    <div
                                        className={`
                                    border rounded-lg p-5 flex items-start gap-4 w-full transition-colors duration-300 ease-in-out
                                    ${stateSuffix === 'verified' ? 'bg-[#E0F2F1] border-[#4DB6AC]' : ''}
                                    ${stateSuffix === 'pending' ? 'bg-[#F3E5F5] border-[#AB47BC]' : ''}
                                    ${stateSuffix === 'not_applicable' ? 'bg-gray-100 border-gray-300 opacity-50' : ''}
                                `}
                                    >
                                        <div className="flex-shrink-0 pt-px">
                                            <div
                                                className={`
                                            w-8 h-8 rounded-full flex justify-center items-center transition-colors duration-300 ease-in-out
                                            ${stateSuffix === 'verified' ? 'bg-[#4DB6AC]' : ''}
                                            ${stateSuffix === 'pending' ? 'bg-[#AB47BC]' : ''}
                                            ${stateSuffix === 'not_applicable' ? 'bg-gray-400' : ''}
                                        `}
                                            ></div>
                                        </div>
                                        <div className="flex-grow flex flex-col">
                                            <h2 className="text-base font-medium mb-px text-[#212529] leading-snug">Artisan Profile</h2>
                                            <p
                                                className={`text-sm mb-1 leading-snug ${stateSuffix === 'verified' ? 'text-[#00796B]' : 'text-[#6C757D]'}`}
                                            >
                                                {description}
                                            </p>
                                            {statusText && (
                                                <span
                                                    className={`text-sm font-medium block ${stateSuffix === 'verified' ? 'text-[#00796B]' : ''} ${stateSuffix === 'pending' ? 'text-[#8E24AA]' : ''}`}
                                                >
                                                    {statusText}
                                                </span>
                                            )}
                                            {emailVerificationStatus === 'completed' && !isComplete && (
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
                                (() => {
                                    const status = idVerificationStatus;
                                    const stateSuffix = status === 'confirmed' ? 'verified' : status === 'pending' ? 'pending' : status === 'rejected' ? 'rejected' : status === 'not_started' ? 'not_started' : 'not_applicable';
                                    const statusText = getStatusText('id');
                                    const description = getStatusDescription('id');
                                    const needsAction = status === 'not_started' || status === 'rejected';
                                    const canUpload = emailVerificationStatus === 'completed' && profileCompletionStatus === 'completed';

                                    return (
                                        <div
                                            className={`
                                        border rounded-lg p-5 flex items-start gap-4 w-full transition-colors duration-300 ease-in-out
                                        ${stateSuffix === 'verified' ? 'bg-[#E0F2F1] border-[#4DB6AC]' : ''}
                                        ${stateSuffix === 'pending' ? 'bg-[#F3E5F5] border-[#AB47BC]' : ''}
                                        ${stateSuffix === 'rejected' ? 'bg-[#FFEBEE] border-[#EF5350]' : ''}
                                        ${stateSuffix === 'not_started' ? 'bg-white border-[#DEE2E6]' : ''}
                                        ${stateSuffix === 'not_applicable' ? 'bg-gray-100 border-gray-300 opacity-50' : ''}
                                        ${!canUpload && stateSuffix === 'not_started' ? 'opacity-60 cursor-not-allowed' : ''}
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
                                                ${stateSuffix === 'not_applicable' ? 'bg-gray-400' : ''}
                                            `}
                                                ></div>
                                            </div>
                                            <div className="flex-grow flex flex-col">
                                                <h2 className="text-base font-medium mb-px text-[#212529] leading-snug">ID Verification</h2>
                                                <p
                                                    className={`text-sm mb-1 leading-snug ${stateSuffix === 'verified' ? 'text-[#00796B]' : stateSuffix === 'rejected' ? 'text-[#D32F2F]' : 'text-[#6C757D]'}`}
                                                >
                                                    {description}
                                                </p>
                                                {statusText && (
                                                    <span
                                                        className={`text-sm font-medium block ${stateSuffix === 'verified' ? 'text-[#00796B]' : ''} ${stateSuffix === 'pending' ? 'text-[#8E24AA]' : ''} ${stateSuffix === 'rejected' ? 'text-[#D32F2F]' : ''}`}
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
                                                            disabled={!canUpload}
                                                            className="text-xs px-3 py-1.5 h-auto border-[#ced4da] hover:bg-[#f8f9fa] hover:border-[#adb5bd] text-[#212529] disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {status === 'rejected' ? 'Re-upload ID' : 'Upload ID'}
                                                        </Button>
                                                        {!canUpload && <span className="text-xs text-gray-500 ml-2">(Complete previous steps first)</span>}
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
                            disabled={!isVerified}
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
