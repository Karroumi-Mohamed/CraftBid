import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import axios from 'axios';
import api, { makeRequest, ApiResponse, ApiError } from '../lib/axois';

interface User {
  id: number;
  name: string;
  email: string;
  roles: { id: number; name: string }[];
  email_verified_at: string | null;
}

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isLoading: boolean;
  isVerified: boolean;
  login: (credentials: {email: string, password: string}) => Promise<ApiResponse<User> & { verificationRequired?: boolean }>;
  logout: () => Promise<ApiResponse<any>>;
  register: (data: any) => Promise<ApiResponse<any>>;
  checkAuthStatus: () => Promise<ApiResponse<User> & { verificationRequired?: boolean }>;
  checkEmailVerification: (data: { id: string; hash: string }) => Promise<ApiResponse<any>>;
  resendVerificationEmail: (data: { email: string }) => Promise<ApiResponse<any>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  const checkAuthStatus = async (): Promise<ApiResponse<User> & { verificationRequired?: boolean }> => {
    setIsLoading(true);
    try {
      const response = await makeRequest<User>(api.get('/user'));
      
      if (response.success && response.data) {
        setUser(response.data);
        setIsVerified(!!response.data.email_verified_at);
        setIsLoading(false);
        return { ...response, verificationRequired: !response.data.email_verified_at };
      } else {
        setUser(null);
        setIsVerified(false);
        const verificationRequired = response.status === 409;
        if (!verificationRequired && response.status !== 401 && response.status !== 419) {
          console.error("Auth check failed:", response.error);
        }
        setIsLoading(false);
        return { ...response, verificationRequired };
      }
    } catch (error) {
      setUser(null);
      setIsVerified(false);
      setIsLoading(false);
      return {
        success: false,
        data: null,
        error: { message: 'Failed to check authentication status' },
        status: 500,
        verificationRequired: false
      };
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const login = async (credentials: {email: string, password: string}): Promise<ApiResponse<User> & { verificationRequired?: boolean }> => {
    setIsLoading(true);
    setUser(null);
    setIsVerified(false);
    
    try {
      await axios.get(`${BASE_URL}/sanctum/csrf-cookie`);
      
      const loginAttemptResponse = await makeRequest(api.post('/login', credentials));

      if (!loginAttemptResponse.success) {
        setIsLoading(false);
        console.error("Login attempt failed:", loginAttemptResponse.error);
        return { ...loginAttemptResponse, verificationRequired: false };
      }

      const authResponse = await checkAuthStatus();
      setIsLoading(false);
      
      if (!authResponse.success) {
         if (authResponse.verificationRequired) {
            setUser({ email: credentials.email } as User);
            setIsVerified(false);
            return { 
              success: false,
              data: null, 
              error: authResponse.error || { message: 'Email verification required.' }, 
              status: authResponse.status, 
              verificationRequired: true 
            };
         }
         return { 
           ...authResponse, 
           error: authResponse.error || { message: "Login succeeded but failed to fetch user data" },
           verificationRequired: false
         };
      }
      
      return { ...authResponse, verificationRequired: false };

    } catch (csrfError: any) {
      console.error("CSRF token fetch failed:", csrfError);
      setIsLoading(false);
      return { 
        success: false, 
        data: null, 
        error: {
          message: "Authentication setup failed. Please try again.",
          status: csrfError.response?.status
        },
        status: csrfError.response?.status,
        verificationRequired: false
      };
    }
  };

  const logout = async (): Promise<ApiResponse<any>> => {
    setIsLoading(true);
    try {
      const response = await makeRequest(api.post('/logout'));
      
      setUser(null);
      setIsVerified(false);
      setIsLoading(false);
      return response;
    } catch (error: any) {
      console.error("Logout failed:", error);
      setUser(null);
      setIsVerified(false);
      setIsLoading(false);
      
      let apiError: ApiError;
      if (error.status !== undefined) {
        apiError = error;
      } else {
        apiError = { 
          message: error.message || "An unexpected error occurred during logout",
          status: error.response?.status
        };
      }
      
      return { 
        success: false, 
        data: null, 
        error: apiError, 
        status: apiError.status
      };
    }
  };

  const register = async (data: any): Promise<ApiResponse<any>> => {
    setIsLoading(true);
    const response = await makeRequest(api.post('/register', data));
    setIsLoading(false);
    return response;
  };

  const checkEmailVerification = async (data: { id: string; hash: string }): Promise<ApiResponse<any>> => {
    try {
      return await makeRequest(api.get(`/email/verify/${data.id}/${data.hash}`));
    } catch (error: any) {
      let apiError: ApiError;
      if (error.status !== undefined) {
        apiError = error;
      } else {
        apiError = { 
          message: error.message || "Failed to verify email",
          status: error.response?.status
        };
      }
      
      return {
        success: false,
        data: null,
        error: apiError,
        status: apiError.status
      };
    }
  };

  const resendVerificationEmail = async (data: { email: string }): Promise<ApiResponse<any>> => {
    try {
      return await makeRequest(api.post('/email/verification-notification', data));
    } catch (error: any) {
      console.error("Resend verification email failed:", error);
      if (error && typeof error.success === 'boolean') {
        return error;
      }
      return {
        success: false,
        data: null,
        error: { 
          message: error?.message || "Failed to resend verification email",
          status: error?.status
        },
        status: error?.status || 500
      };
    }
  };

  const value = { 
    user, 
    setUser, 
    isLoading, 
    isVerified,
    login, 
    logout, 
    register, 
    checkAuthStatus, 
    checkEmailVerification, 
    resendVerificationEmail 
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
