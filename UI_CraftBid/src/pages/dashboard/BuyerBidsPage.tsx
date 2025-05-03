import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api, { makeRequest } from '@/lib/axois';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { format } from 'date-fns';

interface Bid {
  id: number;
  amount: string;
  status: 'winning' | 'outbid' | 'won' | 'lost';
  created_at: string;
  is_winning: boolean;
}

interface GroupedBid {
  auction_id: number;
  auction_title: string;
  auction_end_date: string;
  auction_status: string;
  current_price: string;
  image_url: string | null;
  category: string;
  artisan_name: string;
  product: {
    id: number;
    name: string;
    image_url: string | null;
  };
  bids: Bid[];
  highest_user_bid: string;
  user_is_winning: boolean;
  overall_status: 'winning' | 'outbid' | 'won' | 'lost';
}

interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  last_page: number;
  total: number;
  from: number;
  to: number;
  per_page: number;
}

const BuyerBidsPage: React.FC = () => {
  const { user } = useAuth();
  const [groupedBids, setGroupedBids] = useState<GroupedBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Omit<PaginatedResponse<any>, 'data'> | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [expandedAuctions, setExpandedAuctions] = useState<number[]>([]);

  const fetchBids = async (page = 1, status: string | null = null) => {
    setLoading(true);
    setError(null);
    
    try {
      let url = `/bids?page=${page}`;
      if (status) {
        url += `&status=${status}`;
      }
      
      const response = await makeRequest<PaginatedResponse<GroupedBid>>(api.get(url));
      
      if (response.success && response.data) {
        setGroupedBids(response.data.data || []);
        
        const { data, ...paginationInfo } = response.data;
        setPagination(paginationInfo);
        setCurrentPage(response.data.current_page || 1);
      } else {
        setError(response.error?.message || 'Failed to fetch your bids');
      }
    } catch (err: any) {
      console.error('Error fetching bids:', err);
      setError('Could not load your bids. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBids(1, activeFilter);
  }, [activeFilter]);

  const handleFilterClick = (filter: string | null) => {
    if (activeFilter === filter) {
      setActiveFilter(null);
    } else {
      setActiveFilter(filter);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= (pagination?.last_page ?? 1)) {
      fetchBids(page, activeFilter);
    }
  };

  const toggleExpand = (auctionId: number) => {
    setExpandedAuctions(prev => 
      prev.includes(auctionId)
        ? prev.filter(id => id !== auctionId)
        : [...prev, auctionId]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'won':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border border-green-200 font-montserrat">
            Won
          </Badge>
        );
      case 'winning':
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border border-blue-200 font-montserrat">
            Winning
          </Badge>
        );
      case 'lost':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border border-red-200 font-montserrat">
            Lost
          </Badge>
        );
      case 'outbid':
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border border-amber-200 font-montserrat">
            Outbid
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 border border-gray-200 font-montserrat">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold font-montserrat">My Bids</h1>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant={!activeFilter ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterClick(null)}
            className={`rounded-xl font-montserrat ${!activeFilter ? 'bg-accent1 hover:bg-accent1/90 text-white' : ''}`}
          >
            All
          </Button>
          <Button
            variant={activeFilter === 'winning' ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterClick('winning')}
            className={`rounded-xl font-montserrat ${activeFilter === 'winning' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
          >
            Winning
          </Button>
          <Button
            variant={activeFilter === 'outbid' ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterClick('outbid')}
            className={`rounded-xl font-montserrat ${activeFilter === 'outbid' ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}`}
          >
            Outbid
          </Button>
          <Button
            variant={activeFilter === 'won' ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterClick('won')}
            className={`rounded-xl font-montserrat ${activeFilter === 'won' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
          >
            Won
          </Button>
          <Button
            variant={activeFilter === 'lost' ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterClick('lost')}
            className={`rounded-xl font-montserrat ${activeFilter === 'lost' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}
          >
            Lost
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription className="font-montserrat">{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent1" />
        </div>
      ) : groupedBids.length === 0 ? (
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium font-montserrat text-gray-900 mb-2">No bids found</h3>
              <p className="text-gray-500 font-montserrat mb-6">
                {activeFilter 
                  ? `You don't have any ${activeFilter} bids.` 
                  : "You haven't placed any bids yet."}
              </p>
              <Button 
                onClick={() => window.location.href = '/auctions'} 
                className="bg-accent1 hover:bg-accent1/90 text-white font-montserrat rounded-xl"
              >
                Browse Auctions
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {groupedBids.map((groupedBid) => {
            const isExpanded = expandedAuctions.includes(groupedBid.auction_id);
            const sortedBids = [...groupedBid.bids].sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            
            return (
              <div key={groupedBid.auction_id} className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-52 h-52 relative overflow-hidden p-6">
                    {groupedBid.image_url ? (
                      <img 
                        src={groupedBid.image_url} 
                        alt={groupedBid.auction_title} 
                        className="w-full h-full object-cover object-center rounded-xl"
                        style={{ aspectRatio: '1/1' }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full w-full bg-gray-50 rounded-xl">
                        <span className="text-gray-400 font-montserrat text-sm">No image</span>
                      </div>
                    )}
                    
                    {groupedBid.user_is_winning && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-accent1/30 via-transparent to-accent1/10 pointer-events-none"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 p-6">
                    <div className="flex flex-col h-full justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-4">
                          <div>
                            <h3 className="text-xl font-semibold font-montserrat mb-1 text-gray-900">
                              {groupedBid.auction_title}
                            </h3>
                            <p className="text-sm font-montserrat text-gray-500 mb-1">
                              By {groupedBid.artisan_name}
                            </p>
                            <p className="text-xs font-montserrat text-gray-500">
                              Category: {groupedBid.category}
                            </p>
                          </div>
                          
                          <div className="flex-shrink-0">
                            {getStatusBadge(groupedBid.overall_status)}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <p className="text-sm font-montserrat text-gray-500">Your highest bid</p>
                            <p className="font-bold font-montserrat text-accent1 text-xl">${parseFloat(groupedBid.highest_user_bid).toFixed(2)}</p>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <p className="text-sm font-montserrat text-gray-500">Current price</p>
                            <p className="font-bold font-montserrat text-gray-900 text-xl">${parseFloat(groupedBid.current_price).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mt-5 pt-4 border-t border-gray-100">
                        <div>
                          <p className="text-sm font-montserrat">
                            {new Date(groupedBid.auction_end_date) > new Date() ? (
                              <span className="text-green-600">
                                Ends {format(new Date(groupedBid.auction_end_date), 'PPp')}
                              </span>
                            ) : (
                              <span className="text-red-600">
                                Ended {format(new Date(groupedBid.auction_end_date), 'PPp')}
                              </span>
                            )}
                          </p>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl font-montserrat"
                            onClick={() => toggleExpand(groupedBid.auction_id)}
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="h-4 w-4 mr-1" />
                                Hide Bids
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-4 w-4 mr-1" />
                                Show All Bids ({groupedBid.bids.length})
                              </>
                            )}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl font-montserrat"
                            onClick={() => window.location.href = `/auctions/${groupedBid.auction_id}`}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View Auction
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="px-6 pb-6 pt-2 border-t border-gray-100">
                    <h4 className="text-sm font-semibold font-montserrat mb-3">Your Bid History</h4>
                    <div className="space-y-3">
                      {sortedBids.length > 0 ? (
                        sortedBids.map((bid) => (
                          <div 
                            key={bid.id} 
                            className="flex justify-between items-center p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <div>
                              <p className="font-medium font-montserrat">${parseFloat(bid.amount).toFixed(2)}</p>
                              <p className="text-xs text-gray-500 font-montserrat">
                                {format(new Date(bid.created_at), 'MMM d, yyyy h:mm a')}
                              </p>
                            </div>
                            <div>
                              {getStatusBadge(bid.status)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 font-montserrat text-sm">No bid history available</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          
          {pagination && pagination.last_page > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="font-montserrat rounded-lg"
              >
                Previous
              </Button>
              <span className="font-montserrat">
                Page {currentPage} of {pagination.last_page}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= pagination.last_page}
                className="font-montserrat rounded-lg"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BuyerBidsPage;
