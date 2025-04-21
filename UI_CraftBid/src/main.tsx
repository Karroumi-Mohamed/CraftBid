import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import './index.css'
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RegisterRolePage from './pages/RegisterRolePage';
import RegisterDetailsPage from './pages/RegisterDetailsPage';
import RegisterSuccessPage from './pages/RegisterSuccessPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import RegisterLayout from './pages/RegisterLayout';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import BusinessVerificationPage from './pages/BusinessVerificationPage';


const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <HomePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterLayout />,
    children: [
      {
        path: "", 
        element: <RegisterRolePage />
      },
      {
        path: "details",
        element: <RegisterDetailsPage />
      },
      {
        path: "success",
        element: <RegisterSuccessPage />
      }
    ]
  },
  {
    path: "/verify-email",
    element: <EmailVerificationPage />,
  },
  {
    path: "/status",
    element: <BusinessVerificationPage />,
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>,
)
