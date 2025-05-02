import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext';
import { NavLink, useLocation } from 'react-router-dom'
import LogoutButton from '../auth/LogoutButton';
import { TriangleAlert, Menu, X, Home, Package, Gavel, User, Wallet, Settings, Heart, Clock } from 'lucide-react';

export default function Navbar() {
    const { isVerified, user } = useAuth();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    
    const isArtisan = user?.roles?.some(role => role.name === 'artisan');
    const isDashboardRoute = location.pathname.startsWith('/dashboard');
    
    const toggleMenu = () => setMenuOpen(!menuOpen);

    return (
        <div className="px-6 py-3 flex justify-between items-center relative">
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
                                    to="/dashboard/artisan-profile"
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
                                    to="/dashboard/watchlist"
                                    className={({isActive}) => `font-montserrat font-semibold ${isActive ? 'text-accent1' : 'text-gray-800 hover:text-accent1'}`}
                                >
                                    Watchlist
                                </NavLink>
                            </>
                        )}
                        
                        <NavLink
                            to="/dashboard/wallet"
                            className={({isActive}) => `font-montserrat font-semibold ${isActive ? 'text-accent1' : 'text-gray-800 hover:text-accent1'}`}
                        >
                            Wallet
                        </NavLink>
                        <NavLink
                            to="/dashboard/settings"
                            className={({isActive}) => `font-montserrat font-semibold ${isActive ? 'text-accent1' : 'text-gray-800 hover:text-accent1'}`}
                        >
                            Settings
                        </NavLink>
                    </div>
                )}
                
                {user && isVerified && isDashboardRoute && (
                    <button onClick={toggleMenu} className="md:hidden ml-4">
                        {menuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                )}
            </div>
            
            <div className="flex gap-2">
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
                        <LogoutButton
                            className="flex items-center rounded-4xl ease-in-out px-5 py-1 font-montserrat font-semibold text-accent1"
                        />
                    </>
                )}
                
                {user && isVerified && isDashboardRoute && (
                    <LogoutButton
                        className="flex items-center rounded-4xl ease-in-out px-5 py-1 font-montserrat font-semibold text-accent1"
                    />
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
                <div className="absolute top-full left-0 w-full bg-white shadow-lg z-50 mt-2 p-4 rounded-lg md:hidden">
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
                                    to="/dashboard/artisan-profile"
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
                                    to="/dashboard/watchlist"
                                    onClick={toggleMenu}
                                    className={({isActive}) => `flex items-center font-montserrat font-semibold ${isActive ? 'text-accent1' : 'text-gray-800'}`}
                                >
                                    <Heart size={18} className="mr-2" />
                                    Watchlist
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

