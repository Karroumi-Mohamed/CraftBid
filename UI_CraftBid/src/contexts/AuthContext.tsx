import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: number;
  name: string;
  email: string;
  roles: { id: number; name: string }[];
}

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isLoading: boolean;
  login: (credentials: {email: string, password: string}) => Promise<User>;
  logout: () => Promise<void>;
  register: (data: any) => Promise<any>;
  checkAuthStatus: () => Promise<void>;
  checkEmailVerification: (data: { token: string; email: string }) => Promise<any>;
  resendVerificationEmail: (data: { email: string }) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

  const checkAuthStatus = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/user`);
      setUser(response.data);
      return response.data;
    } catch (error) {
      setUser(null);
      console.error("Not authenticated:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const login = async (credentials: {email: string, password: string}): Promise<User> => {
    setIsLoading(true);
    try {
      await axios.get(`${API_BASE_URL}/sanctum/csrf-cookie`);

      await axios.post(`${API_BASE_URL}/login`, credentials, {
          headers: { 'Accept': 'application/json' }
      });

      const loggedInUser = await checkAuthStatus();
      if (!loggedInUser) {
          throw new Error('Login succeeded but failed to fetch user data.');
      }
      return loggedInUser;
    } catch (error) {
       setUser(null);
       console.error("Login failed:", error);
       throw error;
    } finally {
       setIsLoading(false);
    }
  };

  const logout = async () => {
     setIsLoading(true);
     try {
        await axios.post(`${API_BASE_URL}/logout`);
        setUser(null);
     } catch (error) {
        console.error("Logout failed:", error);
        setUser(null);
        throw error;
     } finally {
        setIsLoading(false);
     }
  };

   const register = async (data: any) => {
     return axios.post(`${API_BASE_URL}/api/register`, data);
   };

   const checkEmailVerification = async (data: { token: string; email: string }) => {
     try {
       const response = await axios.post(`${API_BASE_URL}/verify-email`, data);
       return response;
     } catch (error) {
       throw error;
     }
   };

   const resendVerificationEmail = async (data: { email: string }) => {
     try {
       const response = await axios.post(`${API_BASE_URL}/resend-verification-email`, data);
       return response;
     } catch (error) {
       throw error;
     }
   };

  const value = { user, setUser, isLoading, login, logout, register, checkAuthStatus, checkEmailVerification, resendVerificationEmail };

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
