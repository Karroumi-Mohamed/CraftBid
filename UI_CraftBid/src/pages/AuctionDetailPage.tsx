import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api, { makeRequest } from '../lib/axois';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft, Clock, User, Calendar, Info, DollarSign, Trophy, AlertCircle } from "lucide-react";
import { formatDistanceToNow, format } from 'date-fns';
import echo from '@/lib/echo';
import Navbar from '@/components/ui/navbar';
import './auction-animations.css';

interface Auction {
  id: number;
  price: string;
  reserve_price: string;
  bid_increment: string;
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

interface Bid {
  id: number;
  amount: number;
  created_at: string;
  user: {
    id: number;
    name: string;
  };
}

interface BidPlacedEventPayload {
    bid: Bid;
    auction: {
        id: number;
        price: string;
        bid_count: number;
    };
}

interface AuctionEndedEventPayload {
    auctionId: number;
    winner: string;
    finalPrice: number;
}

const AuctionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidError, setBidError] = useState<string | null>(null);
  const [bidSuccess, setBidSuccess] = useState<string | null>(null);
  const [placingBid, setPlacingBid] = useState(false);
  const [highestBid, setHighestBid] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isWinning, setIsWinning] = useState(false);

  const fetchAuction = async () => {
    try {
      setLoading(true);
      const response = await makeRequest(api.get(`/auctions/${id}`));
      console.log(response.data);
      if (response.success) {
        setAuction(response.data);
        const primaryImage = response.data.product.images.find((img: { is_primary: boolean }) => img.is_primary);
        const defaultImage = primaryImage || response.data.product.images[0];
        if (defaultImage) {
          setSelectedImage('http://localhost:8000/storage/' + defaultImage.path);
        }
      } else {
        setError(response.error?.message || 'Failed to fetch auction');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred while fetching auction');
    } finally {
      setLoading(false);
    }
  };

  const fetchBids = async () => {
    try {
      const response = await makeRequest(api.get(`/auctions/${id}/bids`));

      if (response.success) {
        setBids(response.data.data);
        
        if (user && response.data.data.length > 0) {
          const highestBid = response.data.data[0];
          const userIsWinning = highestBid.user?.id === user.id;
          setIsWinning(userIsWinning);
          console.log('User is winning: ', userIsWinning);
        } else {
          setIsWinning(false);
        }
      }
    } catch (error) {
      console.error('Failed to fetch bids:', error);
    }
  };

  useEffect(() => {
    if (auction) {
      setHighestBid(parseFloat(auction.price));
    }
  }, [auction]);

  useEffect(() => {
    fetchAuction();
    fetchBids();
  }, [id]);

  useEffect(() => {
    if (!auction?.id) return;

    const channelName = `auction.${auction.id}`;
    console.log(`Subscribing to channel: ${channelName}`);
    const channel = echo.channel(channelName);

    channel.listen('.bid.placed', (e: BidPlacedEventPayload) => {
      console.log('WebSocket Event Received (bid.placed):', e);
      setBids(prevBids => {
        if (prevBids.some(b => b.id === e.bid.id)) return prevBids;
        return [e.bid, ...prevBids];
      });
      setHighestBid(parseFloat(e.auction.price));
      
      if (user) {
        setIsWinning(e.bid.user.id === user.id);
      }
      
      setAuction(prevAuction => {
        if (!prevAuction) return null;
        return {
          ...prevAuction,
          price: e.auction.price,
          bid_count: e.auction.bid_count
        };
      });
      setBidSuccess(null);
      setBidError(null);
    });

    channel.listen('.auction.ended', (e: AuctionEndedEventPayload) => {
      console.log('WebSocket Event Received (auction.ended):', e);

      setAuction(prevAuction => {
        if (!prevAuction || prevAuction.id !== e.auctionId) return prevAuction; // Check if event is for current auction
        return {
          ...prevAuction,
          status: 'ended',
          price: e.finalPrice.toString(),

        };
      });

      setHighestBid(e.finalPrice);

      setBidSuccess(`Auction ended! Winner: ${e.winner} at $${e.finalPrice.toFixed(2)}`);
      setBidError(null);

    });

    return () => {
      console.log(`Leaving channel: ${channelName}`);
      channel.stopListening('.bid.placed');
      channel.stopListening('.auction.ended');
      echo.leave(channelName);
    };
  }, [auction?.id, user]);
  
  useEffect(() => {
    if (bids.length > 0 && user) {
      const highestBid = bids[0];
      const userIsWinning = highestBid.user?.id === user.id;
      console.log(`Setting winning status: ${userIsWinning}. Highest bid by: ${highestBid.user?.name}, Current user: ${user.name}`);
      setIsWinning(userIsWinning);
    } else {
      setIsWinning(false);
    }
  }, [bids, user]);

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    setPlacingBid(true);
    setBidError(null);
    setBidSuccess(null);

    try {
      const response = await makeRequest(api.post(`/auctions/${id}/bids`, {
        amount: parseFloat(bidAmount),
      }));

      if (response.success) {
        setBidSuccess('Bid placed successfully!');
        setBidAmount('');
      } else {
        setBidError(response.error?.message || 'Failed to place bid');
      }
    } catch (error: any) {
      setBidError(error.message || 'An error occurred while placing bid');
    } finally {
      setPlacingBid(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blancasi-500">
        <Navbar />
        <div className="flex justify-center items-center h-[calc(100vh-80px)]">
          <div className="flex flex-col items-center bg-black p-8 rounded-3xl shadow-lg border border-gray-800 bg-radial-at-br from-gray-800/30 from-0% via-transparent via-50% to-transparent to-90%">
            <Loader2 className="h-12 w-12 animate-spin text-accent1" />
            <p className="mt-4 font-montserrat text-lg font-medium text-white">Loading auction details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !auction) {
    return (
      <div className="min-h-screen bg-blancasi-500">
        <Navbar />
        <div className="flex justify-center items-center h-[calc(100vh-80px)]">
          <div className="bg-black p-8 rounded-2xl shadow-lg max-w-md w-full border border-gray-800 bg-radial-at-tl from-gray-800/30 from-0% via-transparent via-50% to-transparent to-90%">
            <p className="text-red-400 text-center font-montserrat font-medium">{error || 'Auction not found'}</p>
            <button 
              onClick={() => navigate('/auctions')}
              className="mt-4 w-full bg-accent1 text-black font-montserrat font-semibold py-2 rounded-full hover:bg-accent1/90"
            >
              Back to Auctions
            </button>
          </div>
        </div>
      </div>
    );
  }

  const timeLeft = formatDistanceToNow(new Date(auction.end_date), { addSuffix: true });
  const isActive = auction.status === 'active' && new Date(auction.end_date) > new Date();
  
  const images = auction.product.images.map(img => 'http://localhost:8000/storage/' + img.path);

  return (
    <div className="min-h-screen bg-blancasi-500">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <button 
          onClick={() => navigate('/auctions')}
          className="mb-6 flex items-center font-montserrat font-medium text-gray-700 hover:text-accent1"
        >
          <ArrowLeft size={18} className="mr-2" />
          Back to Auctions
        </button>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="relative bg-white p-4 rounded-3xl border border-gray-200 shadow-sm bg-radial-at-tl from-accent1/5 from-0% via-transparent via-30% to-transparent to-70%">
              <div className="w-full max-w-lg mx-auto">
                <div className="aspect-square relative rounded-2xl overflow-hidden border border-gray-100">
                  <img
                    src={selectedImage || 'http://localhost:8000/storage/' + auction.product.images[0]?.path}
                    alt={auction.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              {images.length > 1 && (
                <div className="flex mt-4 gap-3 overflow-x-auto pb-2 justify-center">
                  {images.map((img, index) => (
                    <div 
                      key={index}
                      onClick={() => setSelectedImage(img)}
                      className={`cursor-pointer rounded-xl overflow-hidden w-16 h-16 border-2 ${selectedImage === img ? 'border-accent1' : 'border-gray-200'}`}
                    >
                      <img 
                        src={img} 
                        alt={`Thumbnail ${index + 1}`} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm bg-radial-at-tr from-accent1/5 from-0% via-transparent via-40% to-transparent to-90%">
              <h1 className="text-3xl font-montserrat font-semibold mb-2">{auction.product.name}</h1>
              <div className="flex items-center mb-6">
                <p className="text-gray-600 font-montserrat">
                  by <span className="font-semibold text-gray-800">{auction.artisan.business_name}</span>
                </p>
              </div>
              
              <div className="prose prose-lg max-w-none font-montserrat">
                <p className="text-gray-700">{auction.product.description}</p>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-4 space-y-6">
            <div className={`bg-white p-6 rounded-3xl border ${isWinning ? 'border-accent1/30 auction-box-winning' : 'border-gray-200 auction-box'} shadow-sm relative overflow-hidden`}>
              <div className={`absolute inset-0 ${isWinning ? 'aurora-glow-winning' : 'aurora-glow'}`}></div>
              <div className="relative z-10">
                <h2 className="text-2xl font-montserrat font-semibold mb-4">Auction Details</h2>
                
                {isActive && user && (
                  <div className="mb-4">
                    {isWinning ? (
                      <div className="hidden">
                      </div>
                    ) : bids.length > 0 ? (
                      <div className="p-2 bg-amber-50 rounded-xl border border-amber-100 flex items-center alert-pulse">
                        <AlertCircle size={18} className="text-amber-600 mr-2 flex-shrink-0" />
                        <p className="text-sm font-montserrat font-medium text-gray-800">You've been outbid. Place a new bid to win!</p>
                      </div>
                    ) : null}
                  </div>
                )}
                
                <div className="space-y-6">
                  <div className={`${isWinning ? 'bg-accent1/5 price-glow-winning' : 'bg-gray-50'} rounded-2xl p-4 border ${isWinning ? 'border-accent1/20' : 'border-gray-100'} relative overflow-hidden`}>
                    <div className={`absolute inset-0 ${isWinning ? 'price-aurora-winning' : 'price-aurora'}`}></div>
                    <div className="relative z-10">
                      <p className="text-3xl font-montserrat font-semibold mb-1">
                        {highestBid !== null ? 
                          highestBid.toLocaleString('en-US', {
                            style: 'decimal',
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          }) 
                        : 'Loading...'}
                        <span className="text-sm ml-1 text-accent1">DH</span>
                      </p>
                      <p className="text-sm text-gray-600 font-montserrat">
                        {auction.bid_count} {auction.bid_count === 1 ? 'bid' : 'bids'} so far
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <Clock size={18} className="text-accent1 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <p className="font-montserrat font-medium text-gray-800">Time Left</p>
                        <p className="text-gray-600 font-montserrat">{timeLeft}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Calendar size={18} className="text-accent1 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <p className="font-montserrat font-medium text-gray-800">End Date</p>
                        <p className="text-gray-600 font-montserrat">{format(new Date(auction.end_date), 'PPp')}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Info size={18} className="text-accent1 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <p className="font-montserrat font-medium text-gray-800">Status</p>
                        <p className="text-gray-600 font-montserrat capitalize">{auction.status}</p>
                      </div>
                    </div>
                  </div>
                  
                  {isActive && (
                    <form onSubmit={handleBidSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="bidAmount" className="font-montserrat">Place Your Bid</Label>
                        <div className="relative">
                          <DollarSign size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-accent1" />
                          <Input
                            id="bidAmount"
                            type="number"
                            step="0.01"
                            min={parseFloat(auction.price) + parseFloat(auction.bid_increment)}
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            placeholder={`Min: ${(parseFloat(auction.price) + parseFloat(auction.bid_increment)).toFixed(2)}`}
                            className="pl-9 py-5 rounded-xl font-montserrat border-gray-200 focus:ring-accent1 focus:border-accent1"
                            required
                          />
                        </div>
                        <p className="text-sm text-gray-500 font-montserrat">
                          Minimum bid increment: {parseFloat(auction.bid_increment).toFixed(2)} DH
                        </p>
                      </div>

                      {bidError && (
                        <Alert variant="destructive" className="rounded-xl">
                          <AlertDescription className="font-montserrat">{bidError}</AlertDescription>
                        </Alert>
                      )}

                      {bidSuccess && (
                        <Alert className="rounded-xl bg-green-50 text-green-800 border-green-200">
                          <AlertDescription className="font-montserrat">{bidSuccess}</AlertDescription>
                        </Alert>
                      )}

                      <Button
                        type="submit"
                        className="w-full bg-accent1 hover:bg-accent1/90 text-black rounded-full py-6 font-montserrat font-semibold"
                        disabled={placingBid || !isActive}
                      >
                        {placingBid ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          'Place Bid'
                        )}
                      </Button>
                    </form>
                  )}

                  {!isActive && (
                    <Alert className="rounded-xl bg-gray-50 border-gray-200">
                      <AlertDescription className="font-montserrat">
                        This auction has {auction.status === 'ended' ? 
                          `ended. Final price: ${parseFloat(auction.price).toLocaleString('en-US', { 
                            style: 'decimal', 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })} DH` 
                        : auction.status === 'pending' ? 'not started yet.' : 'concluded.'}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm bg-radial-at-bl from-accent1/5 from-0% via-transparent via-50% to-transparent to-90%">
              <h2 className="text-xl font-montserrat font-semibold mb-4">Bid History</h2>
              
              <div className="space-y-4">
                {bids.length > 0 ? (
                  bids.map((bid) => (
                    <div 
                      key={bid.id} 
                      className={`flex justify-between items-center border-b border-gray-100 pb-3 ${user && bid.user?.id === user.id ? 'bg-accent1/5 -mx-2 px-2 rounded-lg' : ''}`}
                    >
                      <div className="flex items-center">
                        <User size={18} className={`${user && bid.user?.id === user.id ? 'text-accent1' : 'text-gray-400'} mr-3`} />
                        <div>
                          <div className="flex items-center">
                            <p className="font-montserrat font-medium">
                              {bid.user?.id === user?.id ? 'You' : (bid.user?.name ?? 'Anonymous')}
                            </p>
                            {bid.user?.id === user?.id && (
                              <span className="ml-2 text-[10px] bg-accent1/10 text-accent1 px-1.5 py-0.5 rounded-full font-medium">
                                Your bid
                              </span>
                            )}
                            {bids.indexOf(bid) === 0 && (
                              <span className="ml-2 text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full font-medium flex items-center">
                                <Trophy size={10} className="mr-0.5" />
                                Highest
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 font-montserrat">
                            {bid.created_at ? format(new Date(bid.created_at), 'MMM d, h:mm a') : 'Date unknown'}
                          </p>
                        </div>
                      </div>
                      <p className="font-montserrat font-semibold">
                        {bid.amount.toLocaleString('en-US', { 
                          style: 'decimal', 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })} 
                        <span className="text-xs text-accent1">DH</span>
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 font-montserrat">No bids placed yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionDetailPage;
