import { Auction } from "@/pages/AuctionsPage"
import { Link } from "react-router-dom"
import { differenceInSeconds, parseISO } from "date-fns"
import { useState } from "react"

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
    const [remainingTime, setRemainingTime] = useState<string>(() => formatRemainingTime(auction.end_date));
    const image =  'http://localhost:8000/storage/' +  (auction.product.images.length > 0 ? auction.product.images.find(image => image.is_primary)?.path : auction.product.images[0]?.path);
    return (
        <div className="h-96 aspect-[0.696/1] bg-white rounded-3xl border-black border-1 p-2">
            <div className="w-full aspect-square bg-black rounded-2xl mb-1.5">
                <Link
                    to={`/auctions/${auction.id}`}
                    className="block w-full h-full bg-black rounded-2xl"
                >
                    {image && (
                        <img
                            src={image}
                            className="w-full h-full object-cover rounded-2xl"
                        />
                    )}
                </Link>
            </div>
            <div className="flex justify-between items-center mb-1">
                <div className="flex flex-col">
                    <span className="text-[9px] font-semibold font-montserrat text-black hover:underline hover:italic leading-2">
                        <Link
                            to={`/auctions/${auction.id}`}>
                            by: {namify(auction.artisan.business_name)}
                        </Link>
                    </span>
                    <span className="font-bold text-sm font-montserrat text-black hover:underline hover:italic">
                        <Link
                            to={`/auctions/${auction.id}`}>
                            {auction.product.name}
                        </Link>
                    </span>
                </div>
                <div>
                    <span className="text-3xl font-bold font-montserrat text-black italic">
                        {auction.price.toLocaleString('en-US', {
                            style: 'currency',
                            currency: 'USD',
                        })}
                        <span className="text-[12px] font-bold font-montserrat text-black hover:underline hover:italic leading-2">
                            DH
                        </span>
                    </span>
                </div>
            </div>
            <div className="h-8 overflow-hidden flex items-center justify-between">
                <div className="relative w-2/3">
                    <p className="text-[7px] relative font-semibold font-montserrat text-black leading-2.5 w-full">
                        {auction.product.description}
                    </p>
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#ffffff88] via-[#ffffffef] via-40% from-0% to-white to-100%"></div>
                </div>
                <span className="text-[12px] font-semibold font-montserrat text-gray-400 hover:underline hover:italic leading-2.5">
                    {auction.bid_count} Bids</span>
            </div>

            <div className=" w-full h-8 flex items-center justify-between bg-black rounded-2xl">
                <Link
                    to={`/auctions/${auction.id}`}
                    className="block w-full bg-black rounded-full px-3 py-1 text-white mt-auto"
                >
                    <div className="flex justify-between items-center">
                        <div className="flex items-baseline">
                            <span className="text-xl font-semibold italic font-montserrat">
                                {typeof auction.price === 'number' ? auction.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : parseFloat(auction.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-[9px] italic font-semibold font-montserrat ml-1">
                                DH
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="block text-[9px] font-medium font-montserrat text-white leading-none opacity-90">
                                {remainingTime !== "Ended" ? "remaining" : "Status"}
                            </span>
                            <span className="block text-xs font-medium font-montserrat leading-tight">
                                {remainingTime}
                            </span>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    )
}

