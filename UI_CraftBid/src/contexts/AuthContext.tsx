import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import axios from 'axios';
import api, { makeRequest, ApiResponse, ApiError } from '../lib/axois';

type EmailVerificationStatus = 'not_started' | 'sent' | 'completed';
type IdVerificationStatus = 'not_started' | 'pending' | 'confirmed' | 'rejected' | null; 
type ProfileCompletionStatus = 'pending' | 'completed' | null; 

interface User {
    id: number;
    name: string;
    email: string;
    roles: { id: number; name: string }[];
    email_verified_at: string | null;
}

interface VerificationStatusResponse {
    role: 'buyer' | 'artisan' | 'admin';
    emailStatus: EmailVerificationStatus;
    idStatus: IdVerificationStatus | null;
    hasArtisanProfile: boolean | null;
}

interface AuthContextType {
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
    isLoading: boolean;
    isVerified: boolean; 
    emailVerificationStatus: EmailVerificationStatus;
    idVerificationStatus: IdVerificationStatus;
    profileCompletionStatus: ProfileCompletionStatus;
    login: (credentials: { email: string, password: string }) => Promise<ApiResponse<User>>; 
    logout: () => Promise<ApiResponse<any>>;
    register: (data: any) => Promise<ApiResponse<any>>;
    checkAuthStatus: () => Promise<ApiResponse<User>>; 
    checkEmailVerification: (data: { id: string; hash: string }) => Promise<ApiResponse<any>>;
    resendVerificationEmail: (data: { email: string }) => Promise<ApiResponse<any>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isVerified, setIsVerified] = useState(false); 
    const [emailVerificationStatus, setEmailVerificationStatus] = useState<EmailVerificationStatus>('not_started');
    const [idVerificationStatus, setIdVerificationStatus] = useState<IdVerificationStatus>(null);
    const [profileCompletionStatus, setProfileCompletionStatus] = useState<ProfileCompletionStatus>(null);

    const calculateOverallVerification = ( 
        role: string | null | undefined, 
        emailStatus: EmailVerificationStatus, 
        profileStatus: ProfileCompletionStatus, 
        idStatus: IdVerificationStatus
    ): boolean => {
        if (!role) return false;
        if (role === 'artisan') {
            return emailStatus === 'completed' && profileStatus === 'completed' && idStatus === 'confirmed';
        } else {
            return emailStatus === 'completed';
        }
    };

    const checkAuthStatus = async (): Promise<ApiResponse<User>> => {
        setIsLoading(true);
        let fetchedUser: User | null = null;
        let userResponse: ApiResponse<User> = { success: false, data: null, error: null, status: undefined }; 
        
        setEmailVerificationStatus('not_started');
        setIdVerificationStatus(null);
        setProfileCompletionStatus(null);
        setIsVerified(false);

        try {
            userResponse = await makeRequest<User>(api.get('/user'));

            if (userResponse.success && userResponse.data) {
                fetchedUser = userResponse.data;
                setUser(fetchedUser);
                let currentEmailStatus: EmailVerificationStatus = fetchedUser.email_verified_at ? 'completed' : 'not_started';
                setEmailVerificationStatus(currentEmailStatus);

                try {
                    const statusResponse = await makeRequest<VerificationStatusResponse>(api.get('/user/verification-status'));
                    if (statusResponse.success && statusResponse.data) {
                        const { emailStatus: detailedEmailStatus, idStatus: detailedIdStatus, hasArtisanProfile, role } = statusResponse.data;
                        
                        currentEmailStatus = detailedEmailStatus;
                        setEmailVerificationStatus(detailedEmailStatus);
                        
                        let currentProfileStatus: ProfileCompletionStatus = null;
                        let currentIdStatus: IdVerificationStatus = null;

                        if (role === 'artisan') {
                            currentIdStatus = detailedIdStatus ?? 'not_started';
                            currentProfileStatus = hasArtisanProfile ? 'completed' : 'pending';
                        }

                        setIdVerificationStatus(currentIdStatus);
                        setProfileCompletionStatus(currentProfileStatus);

                        setIsVerified(calculateOverallVerification(role, currentEmailStatus, currentProfileStatus, currentIdStatus));

                    } else {
                        console.warn("Failed to fetch detailed verification status:", statusResponse.error);
                        const role = fetchedUser.roles?.[0]?.name;
                        let currentProfileStatus: ProfileCompletionStatus = null;
                        let currentIdStatus: IdVerificationStatus = null;
                        if (role === 'artisan') {
                           currentProfileStatus = 'pending'; 
                           currentIdStatus = 'not_started'; 
                        }
                        setIdVerificationStatus(currentIdStatus);
                        setProfileCompletionStatus(currentProfileStatus);
                        setIsVerified(calculateOverallVerification(role, currentEmailStatus, currentProfileStatus, currentIdStatus));
                    }
                } catch (statusError) {
                    console.error("Error fetching detailed verification status:", statusError);
                    const role = fetchedUser.roles?.[0]?.name;
                    let currentProfileStatus: ProfileCompletionStatus = null;
                    let currentIdStatus: IdVerificationStatus = null;
                    if (role === 'artisan') {
                        currentProfileStatus = 'pending';
                        currentIdStatus = 'not_started';
                    }
                    setIdVerificationStatus(currentIdStatus);
                    setProfileCompletionStatus(currentProfileStatus);
                    setIsVerified(calculateOverallVerification(role, currentEmailStatus, currentProfileStatus, currentIdStatus));
                }
            } else {
                setUser(null);
                 if (userResponse.status !== 401 && userResponse.status !== 403 && userResponse.status !== 409 && userResponse.status !== 419) {
                    console.error("Auth check (/user) failed with unexpected status:", userResponse.status, userResponse.error);
                }
            }
        } catch (error) {
            console.error("Error during checkAuthStatus:", error);
            setUser(null);
            userResponse = { success: false, data: null, error: { message: 'Failed to check auth status' }, status: 500 };
        } finally {
            setIsLoading(false);
        }

        return userResponse;
    };

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const login = async (credentials: { email: string, password: string }): Promise<ApiResponse<User>> => {
        setIsLoading(true);
        setUser(null);
        setIsVerified(false);
        setEmailVerificationStatus('not_started');
        setIdVerificationStatus(null);
        setProfileCompletionStatus(null);

        let loginAttemptResponse: ApiResponse<any>; 
        try {
            await axios.get(`http://localhost:8000/sanctum/csrf-cookie`);
            loginAttemptResponse = await makeRequest(api.post('/login', credentials));

            if (!loginAttemptResponse.success) {
                setIsLoading(false);
                console.error("Login attempt failed:", loginAttemptResponse.error);
                return { ...loginAttemptResponse, data: null }; 
            }

            const authResponse = await checkAuthStatus(); 
            
            if (!authResponse.success) {
                 return authResponse;
            }
            
            return authResponse;

        } catch (csrfError: any) {
            console.error("CSRF token fetch or login API call failed:", csrfError);
            setIsLoading(false);
            const errorResponse: ApiResponse<User> = {
                success: false,
                data: null,
                error: {
                    message: csrfError.response?.data?.message || "Authentication setup failed. Please try again.",
                    status: csrfError.response?.status ?? undefined
                },
                status: csrfError.response?.status ?? undefined
            };
             if (csrfError.response?.status === 422 && csrfError.response?.data?.errors) {
                 if (errorResponse.error) {
                    errorResponse.error.errors = csrfError.response.data.errors;
                 } else {
                     errorResponse.error = { 
                         message: csrfError.response?.data?.message || "Validation Error", 
                         errors: csrfError.response.data.errors, 
                         status: 422 
                     };
                 }
                 errorResponse.status = 422;
             }
             return errorResponse;
        }
    };

    const logout = async (): Promise<ApiResponse<any>> => {
        setIsLoading(true);
        try {
            const response = await makeRequest(api.post('/logout'));
            setUser(null);
            setIsVerified(false);
            setEmailVerificationStatus('not_started');
            setIdVerificationStatus(null);
            setProfileCompletionStatus(null);
            setIsLoading(false);
            return response;
        } catch (error: any) {
            console.error("Logout failed:", error);
            setUser(null);
            setIsVerified(false);
            setEmailVerificationStatus('not_started');
            setIdVerificationStatus(null);
            setProfileCompletionStatus(null);
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
                success: false, data: null, error: apiError, status: apiError.status
            };
        }
    };

    const register = async (data: any): Promise<ApiResponse<any>> => {
        setIsLoading(true);
        let response: ApiResponse<any>;
        try {
             await axios.get(`http://localhost:8000/sanctum/csrf-cookie`);
             response = await makeRequest(api.post('/register', data));
             if(response.success) {
                await checkAuthStatus(); 
             } else {
                 setIsLoading(false);
             }
        } catch (error: any) {
            console.error("Registration or CSRF failed:", error);
            setIsLoading(false);
             response = {
                success: false,
                data: null,
                error: {
                    message: error.response?.data?.message || "Registration failed.",
                    errors: error.response?.data?.errors,
                    status: error.response?.status
                },
                status: error.response?.status
            };
        }
        return response;
    };

    const checkEmailVerification = async (data: { id: string; hash: string }): Promise<ApiResponse<any>> => {
        let response: ApiResponse<any>;
        try {
            response = await makeRequest(api.get(`/email/verify/${data.id}/${data.hash}`));
            if(response.success) {
                await checkAuthStatus();
            }
        } catch (error: any) {
             console.error("Email verification check failed:", error);
             let apiError: ApiError;
             if (error.response) { 
                 apiError = {
                     message: error.response.data?.message || error.message || "Failed to verify email",
                     errors: error.response.data?.errors,
                     status: error.response.status
                 };
             } else if (error.status !== undefined) { 
                 apiError = error;
             } else {
                 apiError = { message: error.message || "Failed to verify email", status: undefined };
             }
             response = { success: false, data: null, error: apiError, status: apiError.status };
        }
        return response;
    };

    const resendVerificationEmail = async (data: { email: string }): Promise<ApiResponse<any>> => {
         let response: ApiResponse<any>;
        try {
             response = await makeRequest(api.post('/auth/resend-verification-email', data));
             if(response.success) {
                setEmailVerificationStatus('sent');
             }
        } catch (error: any) {
            console.error("Resend verification email failed:", error);
             let apiError: ApiError;
             if (error.response) { 
                 apiError = {
                     message: error.response.data?.message || error.message || "Failed to resend verification email",
                     errors: error.response.data?.errors,
                     status: error.response.status
                 };
             } else if (error.status !== undefined) { 
                 apiError = error;
             } else {
                 apiError = { message: error.message || "Failed to resend verification email", status: undefined };
             }
             response = { success: false, data: null, error: apiError, status: apiError.status };
        }
        return response;
    };


    const value = {
        user,
        setUser,
        isLoading,
        isVerified, 
        emailVerificationStatus,
        idVerificationStatus,
        profileCompletionStatus,
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
