import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { makeRequest } from '../lib/axois';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
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
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto py-8">
                <div className="text-red-500 text-center">{error}</div>
            </div>
        );
    }

    return (
        <div className="bg-blancasi-500 min-h-screen">
            <Navbar />
            {!user && <Hero />}
            <div className="container mx-auto py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Active Auctions</h1>
                    <div className="flex gap-4">
                        <Input
                            placeholder="Search auctions..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            className="w-64"
                        />
                        <Select
                            value={filters.sort}
                            onValueChange={(value) => handleFilterChange('sort', value)}
                        >
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="end_date">End Date</SelectItem>
                                <SelectItem value="price">Price</SelectItem>
                                <SelectItem value="bid_count">Bid Count</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={filters.sortDirection}
                            onValueChange={(value) => handleFilterChange('sortDirection', value)}
                        >
                            <SelectTrigger className="w-32">
                                <SelectValue placeholder="Direction" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="asc">Ascending</SelectItem>
                                <SelectItem value="desc">Descending</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {auctions.map((auction) => (
                        <Card
                            auction={auction}
                        />
                    ))}
                </div>

                    {auctions.length === 0 && (
                        <div className="text-center py-8">
                            <p className="text-gray-500">No auctions found matching your criteria.</p>
                        </div>
                    )}
            </div>
        </div>
    );
};

export default AuctionsPage;
