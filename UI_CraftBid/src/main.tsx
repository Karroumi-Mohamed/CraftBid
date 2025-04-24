import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import './index.css'
import LoginPage from './pages/LoginPage';
import RegisterRolePage from './pages/RegisterRolePage';
import RegisterDetailsPage from './pages/RegisterDetailsPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import RegisterLayout from './pages/RegisterLayout';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import BusinessVerificationPage from './pages/BusinessVerificationPage';
import ArtisanDetailsPage from './pages/ArtisanDetailsPage';
import ArtisanIdUploadPage from './pages/ArtisanIdUploadPage';
import DashboardLayout from './components/layouts/DashboardLayout';
import DashboardHomePage from './pages/dashboard/DashboardHomePage';
import ProductsPage from './pages/dashboard/ProductsPage';
import AuctionsPage from './pages/dashboard/AuctionsPage';
import ArtisanProductsPage from './pages/dashboard/ArtisanProductsPage';
import ArtisanAuctionsPage from './pages/dashboard/ArtisanAuctionsPage';
import ArtisanProfilePage from './pages/dashboard/ArtisanProfilePage';
import BuyerBidsPage from './pages/dashboard/BuyerBidsPage';
import WatchlistPage from './pages/dashboard/WatchlistPage';
import WalletPage from './pages/dashboard/WalletPage';
import SettingsPage from './pages/dashboard/SettingsPage';
import AdminLayout from './components/layouts/AdminLayout';
import AdminRoute from './components/auth/AdminRoute';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUserManagementPage from './pages/admin/AdminUserManagementPage';
import AdminCategoryManagementPage from './pages/admin/AdminCategoryManagementPage';
import AdminArtisanVerificationPage from './pages/admin/AdminArtisanVerificationPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
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
         path: "artisan-details",
         element: <ArtisanDetailsPage />
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
   {
     path: "/upload-id",
     element: (
       <ProtectedRoute>
          <ArtisanIdUploadPage />
       </ProtectedRoute>
     ),
   },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
       { index: true, element: <DashboardHomePage /> },
       { path: "products", element: <ProductsPage /> },
       { path: "auctions", element: <AuctionsPage /> },
       { path: "my-products", element: <ArtisanProductsPage /> },
       { path: "my-auctions", element: <ArtisanAuctionsPage /> },
       { path: "artisan-profile", element: <ArtisanProfilePage /> },
       { path: "my-bids", element: <BuyerBidsPage /> },
       { path: "watchlist", element: <WatchlistPage /> },
       { path: "wallet", element: <WalletPage /> },
       { path: "settings", element: <SettingsPage /> },
     ]
  },
  {
    path: "/admin",
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: "users", element: <AdminUserManagementPage /> },
      { path: "categories", element: <AdminCategoryManagementPage /> },
      { path: "artisans", element: <AdminArtisanVerificationPage /> },
      { path: "settings", element: <AdminSettingsPage /> },
    ]
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>,
)
