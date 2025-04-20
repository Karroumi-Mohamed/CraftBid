import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import axios from 'axios'; // Base axios for CSRF and web routes

// Define the shape of the user object (adjust based on your User model)
interface User {
  id: number;
  name: string;
  email: string;
  roles: { id: number; name: string }[]; // Assuming roles are loaded
  // Add other relevant user fields like email_verified_at if needed
}

// Define the shape of the context value
interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isLoading: boolean;
  login: (credentials: {email: string, password: string}) => Promise<User>; // Return user on success
  logout: () => Promise<void>;
  register: (data: any) => Promise<any>; // Returns API response
  checkAuthStatus: () => Promise<void>; // Function to re-check auth
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start loading initially

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'; // Get from env or default

  // Function to check authentication status
  const checkAuthStatus = async () => {
    setIsLoading(true);
    try {
      // Use /api/user which relies on the session cookie
      // Use base axios with configured defaults (withCredentials=true)
      const response = await axios.get(`${API_BASE_URL}/api/user`);
      setUser(response.data);
      return response.data; // Return user data
    } catch (error) {
      setUser(null);
      console.error("Not authenticated:", error);
      // Don't re-throw here, just means user is not logged in
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Check authentication status on initial load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Login function (using session-based auth)
  const login = async (credentials: {email: string, password: string}): Promise<User> => {
    setIsLoading(true);
    try {
      // 1. Get CSRF cookie
      await axios.get(`${API_BASE_URL}/sanctum/csrf-cookie`); // withCredentials is set globally

      // 2. Attempt login via web route
      await axios.post(`${API_BASE_URL}/login`, credentials, {
          headers: { 'Accept': 'application/json' }
      });

      // 3. If successful, fetch user data to update state
      const loggedInUser = await checkAuthStatus(); // Re-use checkAuth to get user data
      if (!loggedInUser) {
          throw new Error('Login succeeded but failed to fetch user data.');
      }
      return loggedInUser; // Return user on successful login
    } catch (error) {
       setUser(null); // Clear user on login failure
       console.error("Login failed:", error);
       throw error; // Re-throw error so component can display it
    } finally {
       setIsLoading(false);
    }
  };

  // Logout function (using session-based auth)
  const logout = async () => {
     setIsLoading(true);
     try {
        // Use base axios for web route
        await axios.post(`${API_BASE_URL}/logout`);
        setUser(null); // Clear user state
     } catch (error) {
        console.error("Logout failed:", error);
        setUser(null); // Ensure user is cleared even if request fails
        throw error; // Re-throw error if needed
     } finally {
        setIsLoading(false);
     }
  };

   // Register function (using API route)
   const register = async (data: any) => {
     // This function just forwards the registration attempt
     // It doesn't log the user in or set the user state directly
     // It relies on the user verifying email and then logging in separately
     return axios.post(`${API_BASE_URL}/api/register`, data);
   };


  const value = { user, setUser, isLoading, login, logout, register, checkAuthStatus };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Create a hook for easy access to the context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
