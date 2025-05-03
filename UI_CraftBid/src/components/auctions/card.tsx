import { Auction } from "@/pages/AuctionsPage"
import { Link } from "react-router-dom"
import { differenceInSeconds, parseISO } from "date-fns"
import { useState, useEffect } from "react"
import { Heart } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import api, { makeRequest } from "@/lib/axois"

interface CardProps {
    auction: Auction
    onClick?: (auction: Auction) => void
    onMouseEnter?: (auction: Auction) => void
    onMouseLeave?: (auction: Auction) => void
}

const namify = (name: string) => {
    const words = name.split(' ');
    for (let i = 0; i < words.length; i++) {
        words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1);
    }
    if (words.length > 1) {
        return `${words[0]} ${words[1].charAt(0).toUpperCase()}.`;
    }
    return name.charAt(0).toUpperCase() + name.slice(1);
}

const formatRemainingTime = (endDateString: string): string => {
    try {
        const endDate = parseISO(endDateString);
        const now = new Date();
        let secondsRemaining = differenceInSeconds(endDate, now);

        if (secondsRemaining <= 0) {
            return "Ended";
        }

        const days = Math.floor(secondsRemaining / (60 * 60 * 24));
        secondsRemaining %= (60 * 60 * 24);

        const hours = Math.floor(secondsRemaining / (60 * 60));
        secondsRemaining %= (60 * 60);

        const minutes = Math.floor(secondsRemaining / 60);

        let parts: string[] = [];
        if (days > 0) {
            parts.push(`${days}d`);
        }
        if (hours > 0) {
            parts.push(`${hours}h`);
        }
        if (minutes > 0 || (days === 0 && hours === 0 && secondsRemaining > 0)) {
            if (days === 0 && hours === 0 && minutes === 0 && secondsRemaining > 0) {
                parts.push("< 1m");
            } else {
                parts.push(`${minutes}m`);
            }
        } else if (days === 0 && hours === 0 && minutes === 0 && secondsRemaining <= 0) {
            return "Ended";
        }


        return parts.join(' ') || "< 1m";

    } catch (error) {
        console.error("Error parsing date:", endDateString, error);
        return "Invalid date";
    }
};

export default function Card({ auction }: CardProps) {
    const { user } = useAuth();
    const [remainingTime, setRemainingTime] = useState<string>(() => formatRemainingTime(auction.end_date));
    const [isWatched, setIsWatched] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const image = 'http://localhost:8000/storage/' + (auction.product.images.length > 0 ? auction.product.images.find(image => image.is_primary)?.path : auction.product.images[0]?.path);
    
    useEffect(() => {
        if (user) {
            checkWatchlistStatus();
        }
    }, [user, auction.id]);
    
    useEffect(() => {
        const timer = setInterval(() => {
            setRemainingTime(formatRemainingTime(auction.end_date));
        }, 60000);
        
        return () => clearInterval(timer);
    }, [auction.end_date]);
    
    const checkWatchlistStatus = async () => {
        try {
            const response = await makeRequest(api.get(`/watchlist/check/${auction.id}`));
            if (response.success) {
                setIsWatched(response.data.is_watched);
            }
        } catch (error) {
            console.error("Error checking watchlist status:", error);
        }
    };
    
    const toggleWatchlist = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!user) {
            window.location.href = "/login";
            return;
        }
        
        setIsLoading(true);
        try {
            if (isWatched) {
                const response = await makeRequest(api.delete(`/watchlist/${auction.id}`));
                if (response.success) {
                    setIsWatched(false);
                }
            } else {
                const response = await makeRequest(api.post('/watchlist', { auction_id: auction.id }));
                if (response.success) {
                    setIsWatched(true);
                }
            }
        } catch (error) {
            console.error("Error toggling watchlist:", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="h-auto bg-white rounded-3xl border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
            <div className="relative">
                {user && (
                    <button 
                        onClick={toggleWatchlist}
                        disabled={isLoading}
                        className={`absolute top-3 right-3 z-10 p-2.5 rounded-full ${isWatched ? 'bg-accent1/20' : 'bg-black/40'} hover:bg-accent1/30 transition-colors`}
                    >
                        <Heart 
                            size={20} 
                            className={`${isWatched ? 'fill-accent1 text-accent1' : 'text-white'} transition-colors`} 
                        />
                    </button>
                )}
                
                <Link
                    to={`/auctions/${auction.id}`}
                    className="block aspect-square bg-gray-100 rounded-2xl mb-3 overflow-hidden"
                >
                    {image && (
                        <img
                            src={image}
                            className="w-full h-full object-cover rounded-2xl hover:scale-105 transition-transform duration-300"
                            alt={auction.product.name}
                        />
                    )}
                </Link>
            </div>
            
            <div className="flex justify-between items-start mb-2 flex-grow">
                <div className="flex flex-col">
                    <span className="text-xs font-medium font-montserrat text-gray-600 hover:underline hover:text-accent1 transition-colors">
                        <Link to={`/artisans/${auction.artisan.id}`}>
                            by {namify(auction.artisan.business_name)}
                        </Link>
                    </span>
                    <h3 className="font-bold text-base font-montserrat text-black hover:text-accent1 transition-colors line-clamp-2">
                        <Link to={`/auctions/${auction.id}`}>
                            {auction.product.name}
                        </Link>
                    </h3>
                </div>
                <div className="text-right">
                    <span className="text-xs font-medium font-montserrat text-gray-500">
                        {auction.bid_count} {auction.bid_count === 1 ? 'Bid' : 'Bids'}
                    </span>
                </div>
            </div>
            
            <div className="h-10 mb-3 overflow-hidden">
                <p className="text-xs text-gray-600 font-montserrat line-clamp-2">
                    {auction.product.description}
                </p>
            </div>

            <div className="w-full flex items-center justify-between bg-black rounded-xl py-2 px-3 mt-auto">
                <div className="flex items-baseline">
                    <span className="text-xl font-semibold italic font-montserrat text-white">
                        {parseFloat(auction.price.toString()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs italic font-semibold font-montserrat ml-1 text-white">
                        DH
                    </span>
                </div>
                <div className="text-right">
                    <span className="block text-xs font-medium font-montserrat text-white leading-none opacity-75">
                        {remainingTime !== "Ended" ? "remaining" : "ended"}
                    </span>
                    <span className="block text-sm font-medium font-montserrat text-white leading-tight">
                        {remainingTime}
                    </span>
                </div>
            </div>
        </div>
    )
}

