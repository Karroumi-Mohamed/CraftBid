import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight } from 'lucide-react';
import LogoutButton from '../components/auth/LogoutButton';

type VerificationStep = 'email' | 'id';
type VerificationStatus = 'pending' | 'completed' | 'rejected';
type EmailVerificationStatus = 'pending' | 'completed';

const BusinessVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const queryParams = new URLSearchParams(location.search);
  const role = queryParams.get('role') as 'buyer' | 'artisan' | null;
  
  const showBoth = true;
  
  const verificationState = {
    email: 'pending' as EmailVerificationStatus,
    id: 'pending' as VerificationStatus
  };

  const handleResendEmail = () => {
    setTimeout(() => {
      console.log("Email verification resent");
    }, 500);
  };

  const handleContinue = () => {
    navigate('/dashboard');
  };

  const isAllVerified = false; 

  const getEmailStatusLabel = () => {
    return 'Pending';
  };

  const getIDStatusLabel = () => {
    return 'Pending';
  };

  const getEmailBlockStyle = () => {
    return 'border-[#CC58EF]/20 bg-[#CC58EF]/5';
  };

  const getIDBlockStyle = () => {
    return 'border-[#CC58EF]/20 bg-[#CC58EF]/5';
  };

  const getEmailCircleColor = () => {
    return 'bg-[#CC58EF]';
  };

  const getIDCircleColor = () => {
    return 'bg-[#CC58EF]';
  };

  return (
    <div className="min-h-screen bg-white flex flex-col w-full">
      {/* Header with logo and logout button - positioned at the top */}
      <div className='flex justify-between items-center p-5 w-full border-b border-gray-200'>
        <div className='pl-2'>
          <img src="/public/logo.png" className="h-10" alt="CraftBid" />
        </div>
        <LogoutButton />
      </div>
      
      <div className="flex-1 flex flex-col items-center w-full">
        <div className="w-full max-w-xl px-8 py-6">
          <h1 className="text-2xl font-bold text-center mb-2">Complete your business sign up</h1>
          <p className="text-gray-600 text-center mb-8">
            An active verified account status gives you the fullest access of features you can start selling on CraftBid.
          </p>

          <div className={`border rounded-md mb-4 ${getEmailBlockStyle()}`}>
            <div className="flex items-start p-4">
              <div className="mt-1 mr-3">
                <div className={`w-6 h-6 rounded-full ${getEmailCircleColor()}`}></div>
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Email Verification</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Please verify your email address to continue.
                </p>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleResendEmail}
                    className="text-sm bg-white border border-[#CC58EF] rounded-md text-[#CC58EF] px-3 py-1"
                  >
                    Resend Email
                  </button>
                </div>
              </div>
            </div>
          </div>

          {showBoth && (
            <div className={`border rounded-md mb-4 ${getIDBlockStyle()}`}>
              <div className="flex items-start p-4">
                <div className="mt-1 mr-3">
                  <div className={`w-6 h-6 rounded-full ${getIDCircleColor()}`}></div>
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">ID Verification</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Please upload your ID to continue.
                  </p>
                  
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-[#CC58EF]">
                      {getIDStatusLabel()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleContinue}
            disabled={!isAllVerified}
            className="mt-6 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-md font-medium text-white bg-gray-300 cursor-not-allowed"
          >
            Continue <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessVerificationPage;