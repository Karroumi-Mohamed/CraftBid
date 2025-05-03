import React, { useState, useEffect, useRef } from 'react';
import CarouselIndicator from '../utils/CarouselIndicator';

const slides = [
    {
        mainImage: "/auth/sideImage_3.jpg",
        iconImage: "/public/auth/sideIcon_1.png",
        text: "Experience The Souk Modernized"
    },
    {
        mainImage: "/auth/sideImage_2.jpg",
        iconImage: "/public/auth/sideIcon_2.png",
        text: "Discover Artisans of Morocco"
    },
    {
        mainImage: "/auth/sideImage_1.jpg",
        iconImage: "/public/auth/sideIcon_3.png",
        text: "Bid, Win, Bring Culture Home"
    }
];

interface AuthLayoutProps {
    children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const startTimer = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        intervalRef.current = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
        }, 5000);
    };

    useEffect(() => {
        startTimer();
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    useEffect(() => {
        startTimer();
    }, [currentIndex]);


    const handleIndicatorClick = (index: number) => {
        setCurrentIndex(index);
    };

    return (
        <div className="flex flex-row gap-2 items-center justify-center h-screen bg-black p-2">
            <div className="hidden relative h-full lg:flex lg:w-3/5 xl:w-1/2 flex-col justify-end overflow-hidden text-white rounded-lg">
                <div
                    className="flex transition-transform duration-700 ease-in-out h-full"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                    {slides.map((slide, index) => (
                        <div key={index} className="relative w-full h-full flex-shrink-0">
                            <img
                                src={slide.mainImage}
                                className="absolute inset-0 h-full w-full object-cover object-center"
                                alt={`Slide ${index + 1}`}
                            />
                            <div className="absolute inset-0 z-10 flex flex-col justify-between p-4 pointer-events-none">
                                <div className="flex h-full w-full justify-end items-center flex-col mb-10 gap-3 pointer-events-auto">
                                    <img src={slide.iconImage} className='size-14' alt="Slide Icon"/>
                                    <h1 className="text-5xl text-center pointer-events-auto font-bodoni font-black text-transparent bg-clip-text bg-gradient-to-b from-blancasi-500 to-[#77FFED]">
                                        {slide.text}
                                    </h1>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                 <div className="absolute bottom-5 left-0 right-0 z-20 flex justify-center pointer-events-auto">
                    <CarouselIndicator
                        count={slides.length}
                        currentIndex={currentIndex}
                        onClick={handleIndicatorClick}
                    />
                 </div>
            </div>

            <div className="w-full h-full ml-auto rounded-lg shadow-md bg-white font-montserrat overflow-y-auto">
                {children}
            </div>
        </div>
    );
};

export default AuthLayout;
