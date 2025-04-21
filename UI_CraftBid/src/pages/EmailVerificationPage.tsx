import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, XCircle, RefreshCw, ChevronRight, UploadCloud } from 'lucide-react';

const EmailVerificationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { checkEmailVerification, resendVerificationEmail } = useAuth();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');
  const email = queryParams.get('email');
  const role = queryParams.get('role') as 'buyer' | 'artisan' | null;

  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'verified' | 'failed'>('loading');
  const [message, setMessage] = useState<string>('Verifying your email...');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      if (token && email) {
        try {
          const response = await checkEmailVerification({ token, email });
          setVerificationStatus('verified');
          setMessage(response.data.message || 'Your email has been successfully verified!');
        } catch (error) {
          setVerificationStatus('failed');
          setMessage('Email verification failed. The link may have expired or is invalid.');
        }
      } else {
        setVerificationStatus('failed');
        setMessage('Invalid verification link. Missing token or email.');
      }
    };

    verifyEmail();
  }, [token, email, checkEmailVerification]);

  const handleResendVerification = async () => {
    if (!email) return;
    
    setResendLoading(true);
    setResendSuccess(false);
    
    try {
      await resendVerificationEmail({ email });
      setResendSuccess(true);
    } catch (error) {
      console.error('Failed to resend verification email', error);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto pt-8 px-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <img src="/public/logo.png" className="h-10" alt="CraftBid Logo" />
          </div>
          <Link to="/login" className="text-accent1 font-medium hover:underline">
            Sign In
          </Link>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Email Verification Status */}
          <div className="flex flex-col items-center mb-8">
            {verificationStatus === 'loading' ? (
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent1 border-t-transparent"></div>
            ) : verificationStatus === 'verified' ? (
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500 mb-4" />
            )}
            
            <h2 className="text-2xl font-bold text-center mb-2">
              {verificationStatus === 'loading' 
                ? 'Verifying Email' 
                : verificationStatus === 'verified' 
                  ? 'Email Verified!' 
                  : 'Verification Failed'}
            </h2>
            
            <p className="text-gray-600 text-center mb-6">
              {message}
            </p>

            {verificationStatus === 'failed' && (
              <button
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-accent1 text-white rounded-md hover:bg-accent1/90 transition-colors disabled:opacity-50"
              >
                {resendLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Resending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Resend Verification Email
                  </>
                )}
              </button>
            )}

            {resendSuccess && (
              <p className="mt-3 text-sm text-green-600 bg-green-50 p-2 rounded">
                Verification email has been sent. Please check your inbox.
              </p>
            )}
          </div>

          <div className="border-t border-gray-200 my-6"></div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Next Steps</h3>
            
            {verificationStatus === 'verified' ? (
              <>
                <div className="bg-green-50 rounded-md p-4 mb-6">
                  <p className="text-green-800">
                    {role === 'buyer' 
                      ? 'Your email has been verified! You can now sign in and start exploring products.' 
                      : 'Your email has been verified! As an artisan, you need to complete the business verification process.'}
                  </p>
                </div>

                {role === 'artisan' && (
                  <div className="bg-blue-50 rounded-md p-4 mb-6">
                    <h4 className="font-medium text-blue-800 mb-2">Business Verification Required</h4>
                    <p className="text-blue-700 mb-4">
                      To start selling on CraftBid, we need to verify your business credentials. Please prepare the following documents:
                    </p>
                    <ul className="list-disc pl-5 text-blue-700 space-y-2 mb-4">
                      <li>Business registration document</li>
                      <li>Tax identification certificate</li>
                      <li>ID proof of the business owner</li>
                    </ul>
                    <Link 
                      to="/business-verification" 
                      className="flex items-center text-accent1 font-medium hover:underline"
                    >
                      Start business verification <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                )}

                <Link 
                  to="/login" 
                  className="block w-full bg-accent1 text-white py-3 px-4 rounded-md font-medium text-center hover:bg-accent1/90 transition-colors mt-6"
                >
                  {role === 'buyer' ? 'Proceed to Login' : 'Continue to Dashboard'}
                </Link>
              </>
            ) : (
              <div className="bg-gray-100 rounded-md p-4">
                <p className="text-gray-600">
                  Once your email is verified, you'll be able to {role === 'artisan' ? 'proceed with business verification and ' : ''}access all features of CraftBid.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Need help? Contact our support at support@craftbid.com</p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;