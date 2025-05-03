import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext';
import { NavLink, useLocation } from 'react-router-dom'
import LogoutButton from '../auth/LogoutButton';
import { TriangleAlert, Menu, X, Home, Package, Gavel, User, Wallet, Settings, Clock, ChevronDown } from 'lucide-react';

export default function Navbar() {
    const { isVerified, user } = useAuth();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    
    const isArtisan = user?.roles?.some(role => role.name === 'artisan');
    const isDashboardRoute = location.pathname.startsWith('/dashboard');
    
    const toggleMenu = () => setMenuOpen(!menuOpen);
    const toggleUserMenu = () => setUserMenuOpen(!userMenuOpen);

    return (
        <div className="px-6 py-3 flex justify-between items-center relative bg-white z-50 pointer-events-auto">
            <div className="flex items-center">
                <NavLink to="/">
                <img src="/logo.png" className="h-10" alt="CraftBid" />
                </NavLink>
                
                {user && isVerified && isDashboardRoute && (
                    <div className="hidden md:flex ml-8 gap-4">
                        {isArtisan && (
                            <NavLink
                                to="/dashboard"
                                className={({isActive}) => `font-montserrat font-semibold ${isActive ? 'text-accent1' : 'text-gray-800 hover:text-accent1'}`}
                            >
                                Dashboard
                            </NavLink>
                        )}
                        
                        {isArtisan ? (
                            <>
                                <NavLink
                                    to="/dashboard/my-products"
                                    className={({isActive}) => `font-montserrat font-semibold ${isActive ? 'text-accent1' : 'text-gray-800 hover:text-accent1'}`}
                                >
                                    My Products
                                </NavLink>
                                <NavLink
                                    to="/dashboard/my-auctions"
                                    className={({isActive}) => `font-montserrat font-semibold ${isActive ? 'text-accent1' : 'text-gray-800 hover:text-accent1'}`}
                                >
                                    My Auctions
                                </NavLink>
                                <NavLink
                                    to="/dashboard/profile"
                                    className={({isActive}) => `font-montserrat font-semibold ${isActive ? 'text-accent1' : 'text-gray-800 hover:text-accent1'}`}
                                >
                                    Profile
                                </NavLink>
                            </>
                        ) : (
                            <>
                                <NavLink
                                    to="/dashboard/my-bids"
                                    className={({isActive}) => `font-montserrat font-semibold ${isActive ? 'text-accent1' : 'text-gray-800 hover:text-accent1'}`}
                                >
                                    My Bids
                                </NavLink>
                                <NavLink
                                    to="/dashboard/profile"
                                    className={({isActive}) => `font-montserrat font-semibold ${isActive ? 'text-accent1' : 'text-gray-800 hover:text-accent1'}`}
                                >
                                    Profile
                                </NavLink>
                            </>
                        )}
                        
                        <NavLink
                            to="/dashboard/wallet"
                            className={({isActive}) => `font-montserrat font-semibold ${isActive ? 'text-accent1' : 'text-gray-800 hover:text-accent1'}`}
                        >
                            Wallet
                        </NavLink>
                    </div>
                )}
                
                {user && isVerified && isDashboardRoute && (
                    <button onClick={toggleMenu} className="md:hidden ml-4">
                        {menuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                )}
            </div>
            
            <div className="flex gap-2 items-center">
                {!user && (
                    <>
                        <NavLink
                            to="/login"
                            className="flex bg-black hover:bg-stone-900 items-center rounded-4xl bg-radial-[at_95%_5%] ease-in-out from-accent1 from-0% to-transparent to-50% px-5 py-1 font-montserrat font-semibold text-white"
                        >
                            <span className="">Login</span>
                        </NavLink>
                        <NavLink
                            to="/register"
                            className="flex items-center rounded-4xl ease-in-out px-5 py-1 font-montserrat font-semibold text-accent1"
                        >
                            <span className="">Sign Up</span>
                        </NavLink>
                    </>
                )}

                {user && isVerified && !isDashboardRoute && (
                    <>
                        {isArtisan ? (
                            <NavLink
                                to="/dashboard"
                                className="flex items-center rounded-4xl ease-in-out px-5 py-1 font-montserrat font-semibold text-accent1 mr-2"
                            >
                                <span className="">Dashboard</span>
                            </NavLink>
                        ) : (
                            <NavLink
                                to="/dashboard/wallet"
                                className="flex items-center rounded-4xl ease-in-out px-5 py-1 font-montserrat font-semibold text-accent1 mr-2"
                            >
                                <span className="">My Wallet</span>
                            </NavLink>
                        )}
                    </>
                )}

                {user && isVerified && (
                    <div className="relative">
                        <button 
                            onClick={toggleUserMenu}
                            className="flex items-center rounded-full ease-in-out px-2 py-1 font-montserrat font-semibold text-gray-800 hover:bg-gray-100"
                        >
                            {user.name?.substring(0, 1) || "U"}
                            <ChevronDown size={14} className="ml-1" />
                        </button>
                        
                        {userMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-1 z-[60] border border-gray-200">
                                <div className="px-4 py-2 border-b border-gray-100">
                                    <p className="font-montserrat font-medium text-sm">{user.name}</p>
                                    <p className="font-montserrat text-xs text-gray-500 truncate">{user.email}</p>
                                </div>
                                
                                <NavLink
                                    to="/dashboard/profile"
                                    className={({isActive}) => `flex items-center px-4 py-2 text-sm font-montserrat text-gray-700 hover:bg-gray-50 ${isActive ? 'text-accent1' : ''}`}
                                    onClick={() => setUserMenuOpen(false)}
                                >
                                    <User size={16} className="mr-2" />
                                    Profile
                                </NavLink>
                                
                                <NavLink
                                    to="/dashboard/settings"
                                    className="flex items-center px-4 py-2 text-sm font-montserrat text-gray-700 hover:bg-gray-50"
                                    onClick={() => setUserMenuOpen(false)}
                                >
                                    <Settings size={16} className="mr-2" />
                                    Settings
                                </NavLink>
                                
                                <div className="border-t border-gray-100 my-1"></div>
                                
                    <LogoutButton
                                    className="flex items-center w-full text-left px-4 py-2 text-sm font-montserrat text-red-600 hover:bg-gray-50"
                    />
                            </div>
                        )}
                    </div>
                )}

                {user && !isVerified && location.pathname !== '/status' && (
                    <>
                        <NavLink
                            to="/status"
                            className="flex items-center rounded-4xl ease-in-out px-5 py-1 font-montserrat font-semibold text-accent1"
                        >
                            <TriangleAlert strokeWidth={2.5} size={18} className='mr-1' />
                            <span className="">Verify Account</span>
                        </NavLink>
                        <LogoutButton
                            className="flex items-center rounded-4xl ease-in-out px-5 py-1 font-montserrat font-semibold text-accent1"
                        />
                    </>
                )}

                {user && !isVerified && location.pathname === '/status' && (
                    <>
                        <NavLink
                            to="/"
                            className="flex items-center rounded-4xl ease-in-out px-5 py-1 font-montserrat font-semibold text-accent1"
                        >
                            <span className="">Back</span>
                        </NavLink>
                        <LogoutButton
                            className="flex items-center rounded-4xl ease-in-out px-5 py-1 font-montserrat font-semibold text-accent1"
                        />
                    </>
                )}
            </div>

            {/* Mobile menu */}
            {menuOpen && user && isVerified && isDashboardRoute && (
                <div className="absolute top-full left-0 w-full bg-white shadow-lg z-[60] mt-2 p-4 rounded-lg md:hidden">
                    <div className="flex flex-col gap-3">
                        {isArtisan && (
                            <NavLink
                                to="/dashboard"
                                onClick={toggleMenu}
                                className={({isActive}) => `flex items-center font-montserrat font-semibold ${isActive ? 'text-accent1' : 'text-gray-800'}`}
                            >
                                <Home size={18} className="mr-2" />
                                Dashboard
                            </NavLink>
                        )}
                        
                        {isArtisan ? (
                            <>
                                <NavLink
                                    to="/dashboard/my-products"
                                    onClick={toggleMenu}
                                    className={({isActive}) => `flex items-center font-montserrat font-semibold ${isActive ? 'text-accent1' : 'text-gray-800'}`}
                                >
                                    <Package size={18} className="mr-2" />
                                    My Products
                                </NavLink>
                                <NavLink
                                    to="/dashboard/my-auctions"
                                    onClick={toggleMenu}
                                    className={({isActive}) => `flex items-center font-montserrat font-semibold ${isActive ? 'text-accent1' : 'text-gray-800'}`}
                                >
                                    <Gavel size={18} className="mr-2" />
                                    My Auctions
                                </NavLink>
                                <NavLink
                                    to="/dashboard/profile"
                                    onClick={toggleMenu}
                                    className={({isActive}) => `flex items-center font-montserrat font-semibold ${isActive ? 'text-accent1' : 'text-gray-800'}`}
                                >
                                    <User size={18} className="mr-2" />
                                    Profile
                                </NavLink>
                            </>
                        ) : (
                            <>
                                <NavLink
                                    to="/dashboard/my-bids"
                                    onClick={toggleMenu}
                                    className={({isActive}) => `flex items-center font-montserrat font-semibold ${isActive ? 'text-accent1' : 'text-gray-800'}`}
                                >
                                    <Clock size={18} className="mr-2" />
                                    My Bids
                                </NavLink>
                                <NavLink
                                    to="/dashboard/profile"
                                    onClick={toggleMenu}
                                    className={({isActive}) => `flex items-center font-montserrat font-semibold ${isActive ? 'text-accent1' : 'text-gray-800'}`}
                                >
                                    <User size={18} className="mr-2" />
                                    Profile
                                </NavLink>
                            </>
                        )}
                        
                        <NavLink
                            to="/dashboard/wallet"
                            onClick={toggleMenu}
                            className={({isActive}) => `flex items-center font-montserrat font-semibold ${isActive ? 'text-accent1' : 'text-gray-800'}`}
                        >
                            <Wallet size={18} className="mr-2" />
                            Wallet
                        </NavLink>
                        
                        <NavLink
                            to="/dashboard/settings"
                            onClick={toggleMenu}
                            className={({isActive}) => `flex items-center font-montserrat font-semibold ${isActive ? 'text-accent1' : 'text-gray-800'}`}
                        >
                            <Settings size={18} className="mr-2" />
                            Settings
                        </NavLink>
                    </div>
                </div>
            )}
        </div>
    )
}

