import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { makeRequest } from '../lib/axois';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Filter, Search } from "lucide-react";
import Card from '@/components/auctions/card';
import Navbar from '@/components/ui/navbar';
import { useAuth } from '@/contexts/AuthContext';
import Hero from '@/components/auctions/hero';

export interface Auction {
    id: number;
    price: number;
    reserve_price: number;
    bid_count: number;
    start_date: string;
    end_date: string;
    status: string;
    product: {
        id: number;
        name: string;
        description: string;
        images: Array<{
            id: number;
            path: string;
            is_primary: boolean;
        }>;
    };
    artisan: {
        id: number;
        business_name: string;
        user: {
            id: number;
            name: string;
        };
    };
}

const AuctionsPage: React.FC = () => {
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState({
        search: '',
        category: '',
        sort: 'end_date',
        sortDirection: 'asc',
    });
    const [showFilters, setShowFilters] = useState(false);
    const {user} = useAuth();

    const fetchAuctions = async () => {
        try {
            setLoading(true);
            const response = await makeRequest(api.get('/auctions', { params: filters }));
            if (response.success) {
                setAuctions(response.data.data);
            } else {
                setError(response.error?.message || 'Failed to fetch auctions');
            }
        } catch (error: any) {
            setError(error.message || 'An error occurred while fetching auctions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAuctions();
    }, [filters]);

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-blancasi-500">
                <Navbar />
                <div className="flex justify-center items-center h-[calc(100vh-80px)]">
                    <div className="flex flex-col items-center bg-white p-8 rounded-3xl shadow-sm border border-gray-200 bg-radial-at-br from-accent1/5 from-0% via-transparent via-50% to-transparent to-90%">
                        <Loader2 className="h-12 w-12 animate-spin text-accent1" />
                        <p className="mt-4 font-montserrat text-lg font-medium">Loading auctions...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-blancasi-500">
                <Navbar />
                <div className="flex justify-center items-center h-[calc(100vh-80px)]">
                    <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full border border-gray-200 bg-radial-at-tr from-accent1/5 from-0% via-transparent via-50% to-transparent to-90%">
                        <p className="text-red-500 text-center font-montserrat font-medium">{error}</p>
                        <button 
                            onClick={fetchAuctions}
                            className="mt-4 w-full bg-accent1 text-black font-montserrat font-semibold py-2 rounded-full hover:bg-accent1/90"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-blancasi-500">
            <Navbar />
            {!user && <Hero />}
            
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex flex-col mb-10">
                    <h1 className="text-4xl font-montserrat font-semibold mb-6">Discover Auctions</h1>
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-accent1" size={18} />
                            <Input
                                placeholder="Search auctions..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                className="pl-10 py-5 rounded-full border-gray-200 font-montserrat focus:ring-accent1 focus:border-accent1"
                            />
                        </div>
                        
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <button 
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-800 rounded-full font-montserrat text-sm font-medium hover:bg-gray-100 border border-gray-200"
                            >
                                <Filter size={16} className="text-accent1" />
                                Filters
                            </button>
                            
                            <Select
                                value={filters.sort}
                                onValueChange={(value) => handleFilterChange('sort', value)}
                            >
                                <SelectTrigger className="w-32 rounded-full font-montserrat border-gray-200">
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="end_date">End Date</SelectItem>
                                    <SelectItem value="price">Price</SelectItem>
                                    <SelectItem value="bid_count">Bids</SelectItem>
                                </SelectContent>
                            </Select>
                            
                            <Select
                                value={filters.sortDirection}
                                onValueChange={(value) => handleFilterChange('sortDirection', value)}
                            >
                                <SelectTrigger className="w-28 rounded-full font-montserrat border-gray-200">
                                    <SelectValue placeholder="Order" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="asc">Ascending</SelectItem>
                                    <SelectItem value="desc">Descending</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    {showFilters && (
                        <div className="mt-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-200 bg-radial-at-tl from-accent1/5 from-0% via-transparent via-50% to-transparent to-90%">
                            <h3 className="font-montserrat font-medium mb-3">Additional Filters</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Select
                                    value={filters.category}
                                    onValueChange={(value) => handleFilterChange('category', value)}
                                >
                                    <SelectTrigger className="rounded-xl font-montserrat border-gray-200">
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All Categories</SelectItem>
                                        <SelectItem value="pottery">Pottery</SelectItem>
                                        <SelectItem value="textiles">Textiles</SelectItem>
                                        <SelectItem value="jewelry">Jewelry</SelectItem>
                                        <SelectItem value="woodwork">Woodwork</SelectItem>
                                        <SelectItem value="leather">Leather</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                </div>

                {auctions.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {auctions.map((auction) => (
                            <Card
                                key={auction.id}
                                auction={auction}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center">
                        <div className="bg-white p-8 rounded-3xl shadow-sm inline-block border border-gray-200 bg-radial-at-bl from-accent1/5 from-0% via-transparent via-50% to-transparent to-90%">
                            <p className="text-gray-600 font-montserrat font-medium">No auctions found matching your criteria.</p>
                            <button 
                                onClick={() => setFilters({
                                    search: '',
                                    category: '',
                                    sort: 'end_date',
                                    sortDirection: 'asc',
                                })}
                                className="mt-4 bg-accent1 text-black font-montserrat font-semibold px-6 py-2 rounded-full hover:bg-accent1/90"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuctionsPage;
