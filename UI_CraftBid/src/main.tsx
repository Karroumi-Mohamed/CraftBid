import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  createBrowserRouter,
  Navigate, // Import Navigate
  RouterProvider,
} from "react-router-dom";
import './index.css'
// HomePage might not be needed if / redirects to /dashboard
// import HomePage from './pages/HomePage';
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
import DashboardLayout from './components/layouts/DashboardLayout'; // Import DashboardLayout
import DashboardHomePage from './pages/dashboard/DashboardHomePage'; // Import dashboard pages
import ProductsPage from './pages/dashboard/ProductsPage';
import AuctionsPage from './pages/dashboard/AuctionsPage';
import ArtisanProductsPage from './pages/dashboard/ArtisanProductsPage';
import ArtisanAuctionsPage from './pages/dashboard/ArtisanAuctionsPage';
import ArtisanProfilePage from './pages/dashboard/ArtisanProfilePage';
import BuyerBidsPage from './pages/dashboard/BuyerBidsPage';
import WatchlistPage from './pages/dashboard/WatchlistPage';
 import WalletPage from './pages/dashboard/WalletPage';
 import SettingsPage from './pages/dashboard/SettingsPage';
 // Import Admin components
 import AdminLayout from './components/layouts/AdminLayout';
 import AdminRoute from './components/auth/AdminRoute'; // Import AdminRoute
 import AdminDashboardPage from './pages/admin/AdminDashboardPage';
 import AdminUserManagementPage from './pages/admin/AdminUserManagementPage';
 import AdminCategoryManagementPage from './pages/admin/AdminCategoryManagementPage';
 import AdminArtisanVerificationPage from './pages/admin/AdminArtisanVerificationPage';
 import AdminSettingsPage from './pages/admin/AdminSettingsPage';


 const router = createBrowserRouter([
  // Redirect root path to dashboard for logged-in users
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  // Keep existing auth routes
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
       }
       // Removed RegisterSuccessPage route
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
  // Add Dashboard routes (protected and using layout)
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    // Define nested dashboard routes
    children: [
       {
         index: true, // Default route for /dashboard
         element: <DashboardHomePage />,
       },
       {
         path: "products",
         element: <ProductsPage />,
       },
       {
         path: "auctions",
         element: <AuctionsPage />,
       },
       {
         path: "my-products", // Artisan specific
         element: <ArtisanProductsPage />, // TODO: Add role-based protection here or within component
       },
       {
         path: "my-auctions", // Artisan specific
         element: <ArtisanAuctionsPage />, // TODO: Add role-based protection
       },
       {
         path: "artisan-profile", // Artisan specific
         element: <ArtisanProfilePage />, // TODO: Add role-based protection
       },
       {
         path: "my-bids", // Buyer specific
         element: <BuyerBidsPage />, // TODO: Add role-based protection
       },
       {
         path: "watchlist", // Buyer specific
         element: <WatchlistPage />, // TODO: Add role-based protection
       },
       {
         path: "wallet", // Buyer specific (or maybe both?)
         element: <WalletPage />, // TODO: Add role-based protection if needed
       },
       {
         path: "settings",
         element: <SettingsPage />,
       },
       // Add other dashboard routes here
     ]
  },
  // Add Admin routes (protected by AdminRoute and using AdminLayout)
  {
    path: "/admin",
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      {
        index: true, // Default route for /admin
        element: <AdminDashboardPage />,
      },
      {
        path: "users",
        element: <AdminUserManagementPage />,
      },
      {
        path: "categories",
        element: <AdminCategoryManagementPage />,
      },
      {
        path: "artisans",
        element: <AdminArtisanVerificationPage />,
      },
      {
        path: "settings",
        element: <AdminSettingsPage />,
      },
      // Add other admin routes here
    ]
  },
  // Consider adding a 404 Not Found route
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>,
)
