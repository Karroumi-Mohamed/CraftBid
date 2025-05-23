import { useState, useEffect } from 'react';
import Card from "./card";

export default function Hero() {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsMounted(true), 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-[70vh] px-28 flex items-center justify-center overflow-hidden">
            <div>
                <h1 className={`text-6xl font-montserrat font-semibold leading-20 transition-opacity duration-700 ease-in-out ${isMounted ? 'opacity-100' : 'opacity-0'} mb-4`}>
                    <span className={`relative inline-block transition-all transform duration-700 ease-in-out ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <span className="relative px-3 pr-4 inline-block">
                            <div className=" z-10 absolute w-full bg-green-700 h-[70px] top-1.5 left-0 rounded-2xl bg-[url('/hero1.png')] bg-left"></div>
                            <span className={`inline-block relative z-20 text-blancasi-500 transition-all transform duration-700 ease-in-out ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                                Discover
                            </span>

                        </span>
                        &nbsp;handmade
                    </span>
                    <span className={`inline-block transition-all transform duration-700 ease-in-out delay-100 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <span className="italic">crafts,</span>
                        &nbsp;<span className="relative px-3 pr-22 inline-block">
                            <div className=" z-10 absolute w-full bg-green-700 h-[70px] top-1.5 left-0 rounded-2xl bg-[url('/hero2.png')] bg-[-15%_30%] bg-size-[130%_auto]"></div>
                            <span className={`relative z-20 inline-block text-black italic transition-all transform duration-700 ease-in-out delay-200 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                                artisans
                            </span>
                        </span>,
                    </span>
                    <br />
                    <span className={
                        `inline-block font-lora italic font-semibold text-6xl transition-all transform duration-700 ease-in-out delay-200 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`
                    }
                    >Morocco. </span>
                </h1>
                <p className={`mt-6 text-gray-700 max-w-md transition-all duration-700 ease-in-out delay-300 font-montserrat font-semibold ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua..
                </p>
                <button className={`font-montserrat font-semibold mt-8 px-6 py-3 bg-black text-white rounded-full flex items-center gap-2 transition-all duration-700 ease-in-out delay-400 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2`}>
                    start biding <span className="text-xl">→</span>
                </button>
            </div>
            <div className='flex shrink-0'>
                <img
                    src="/tt.png"
                    alt=""
                    className={`h-96 rounded-3xl shadow-2xl transition-all duration-700 ease-out delay-200 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} />
            </div>
        </div >
    )
}

