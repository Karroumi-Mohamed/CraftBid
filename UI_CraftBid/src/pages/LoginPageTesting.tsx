import React, { useState, useEffect } from 'react'; // Import useState, useEffect
import LoginForm from '../components/auth/LoginForm';
import { Link } from 'react-router-dom';
import CarouselIndicator from '../components/utils/CarouselIndicator';

// Define slide data
const slides = [
  {
    bgImage: "/auth/sideImage_1.jpg",
    icon: "/auth/sideIcon_1.png", // Assuming icons are in public/auth/
    text: "Experience The Souk Modernized"
  },
  {
    bgImage: "/auth/sideImage_2.jpg",
    icon: "/auth/sideIcon_2.png",
    text: "Discover Artisans of Morocco"
  },
  {
    bgImage: "/auth/sideImage_3.jpg",
    icon: "/auth/sideIcon_3.png",
    text: "Bid, Win, Bring Culture Home"
  }
];

const LoginPageTesting: React.FC = () => { // Renamed component
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

    // Automatic slide transition
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlideIndex((prevIndex) => (prevIndex + 1) % slides.length);
        }, 5000); // Change slide every 5 seconds

        return () => clearInterval(timer); // Cleanup interval on unmount
    }, []);

    const handleIndicatorClick = (index: number) => {
        setCurrentSlideIndex(index);
    };

    const currentSlide = slides[currentSlideIndex];

    return (
        <div className="flex flex-row min-h-screen bg-gray-100">

            {/* Left Section (Slideshow) */}
            <div className="hidden relative h-screen lg:flex lg:w-3/5 xl:w-1/2 flex-col justify-end overflow-hidden text-white rounded-r-lg">
                {/* Background Image with basic transition */}
                <img
                    key={currentSlide.bgImage} // Add key for potential transition libraries
                    src={currentSlide.bgImage}
                    className="absolute inset-0 h-full w-full object-cover object-center -z-10 transition-opacity duration-500 ease-in-out" // Basic transition
                    alt="Decorative background"
                />
                 <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent opacity-90"></div>

                {/* Content aligned to bottom */}
                <div className="relative z-10 p-10 flex flex-col items-center text-center mb-10">
                    <img src={currentSlide.icon} className='size-14 mb-4' alt="Icon" />
                    <h1 className="text-4xl xl:text-5xl font-bold mb-6 leading-tight text-amber-100 tracking-tight">
                        {currentSlide.text}
                    </h1>
                    <CarouselIndicator
                        count={slides.length}
                        currentIndex={currentSlideIndex}
                        onClick={handleIndicatorClick} // Use handler
                    />
                </div>
                 <div className="absolute bottom-4 left-4 text-xs text-gray-300 opacity-70 z-10">
                     © {new Date().getFullYear()} CraftsBid
                 </div>
                    <p className='font-medium'>
                        Don't have an account? <Link to="/register" className="text-accent1 underline">Sign Up</Link>
                    </p>
                </div>
                <div className='flex flex-col items-center justify-center w-fit mx-auto'>

                    <div className='flex flex-col items-center justify-center w-full mt-20'>
                        <h1 className='text-black text-2xl font-bold'>Welcome back to CraftBid!</h1>
                        <p className='text-lg font-semibold text-gray-400 px-10 '>Please enter your details to sign in your account</p>
                    </div>

                    <div className='flex flex-col items-center justify-center w-full mt-8'>
                        <div className='flex flex-col gap-4 w-full'>
                            <button className="flex font-bold w-full items-center justify-center gap-2 rounded-md border-black bg-white px-4 text-black hover:bg-gray-50 py-3 border-2">
                                <img src="/public/auth/google.svg" className="size-7" alt="Google logo" />
                                Continue with Google
                            </button>

                            <button className="flex font-bold w-full items-center justify-center gap-2 rounded-md border-black bg-white px-4  text-black hover:bg-gray-50 py-3 border-2">
                                <img src="/public/auth/apple.svg" className="size-7" alt="Apple logo" />
                                Continue with Apple
                            </button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-2 border-gray-300"></div>
                                </div>
                                <div className="relative flex justify-center text-xs font-semibold ">
                                    <span className="bg-white px-4 text-gray-400">Or sign in with</span>
                                </div>
                            </div>
                        </div>
                        <LoginForm />
                        <Link to="/forgot-password" className="text-black mt-4 underline">
                            Forgot password?
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPageTesting;
