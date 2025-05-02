import React from 'react'
import { useAuth } from '@/contexts/AuthContext';
import { NavLink, useLocation } from 'react-router-dom'
import LogoutButton from '../auth/LogoutButton';
import { TriangleAlert } from 'lucide-react';

export default function Navbar() {
    const { isVerified, user } = useAuth();
    const location = useLocation();
    console.log("Navbar location", location.pathname);

    return (
        <div className="px-6 py-3 flex justify-between items-center">
            <div>
                <img src="/logo.png" className="h-10" alt="CraftBid" />
            </div>
            <div className="flex gap-2">
                {!user && (
                    <>
                        <NavLink
                            to="/login"
                            className="flex bg-black hover:bg-stone-900 items-center rounded-4xl bg-radial-[at_95%_5%] ease-in-out from-accent1 from-0% to-transparent to-50% px-5 py-1 font-montserrat  font-semibold text-white"
                        >
                            <span className="">Login</span>
                        </NavLink>
                        <NavLink
                            to="/register"
                            className="flex items-center rounded-4xl ease-in-out  px-5 py-1 font-montserrat  font-semibold text-accent1"
                        >
                            <span className="">Sign Up</span>
                        </NavLink>
                    </>
                )}

                {user && isVerified && (
                    <LogoutButton
                        className="flex items-center rounded-4xl ease-in-out  px-5 py-1 font-montserrat  font-semibold text-accent1"
                    />
                )}


                {user && !isVerified && location.pathname !== '/status' && (
                    <>
                        <NavLink
                            to="/status"
                            className="flex items-center rounded-4xl ease-in-out  px-5 py-1 font-montserrat  font-semibold text-accent1"
                        >

                            <TriangleAlert strokeWidth={2.5} size={18} className='mr-1' />
                            <span className="">Verify Account</span>
                        </NavLink>
                        <LogoutButton
                            className="flex items-center rounded-4xl ease-in-out  px-5 py-1 font-montserrat  font-semibold text-accent1"
                        />
                    </>

                )}

                {user && !isVerified && location.pathname === '/status' && (
                    <>
                        <NavLink
                            to="/"
                            className="flex items-center rounded-4xl ease-in-out  px-5 py-1 font-montserrat  font-semibold text-accent1"
                        >
                            <span className="">Back</span>
                        </NavLink>
                        <LogoutButton
                            className="flex items-center rounded-4xl ease-in-out  px-5 py-1 font-montserrat  font-semibold text-accent1"
                        />
                    </>
                )}
            </div>


        </div>
    )
}

