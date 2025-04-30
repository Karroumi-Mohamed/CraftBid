import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api, { makeRequest } from '../lib/axois';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow, format } from 'date-fns';
import echo from '@/lib/echo';

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

  const fetchAuction = async () => {
    try {
      setLoading(true);
      const response = await makeRequest(api.get(`/auctions/${id}`));
      console.log(response.data);
      if (response.success) {
        setAuction(response.data);
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
  }, [auction?.id]);

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
        setBidSuccess('Bid placed successfully! Waiting for confirmation...');
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
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !auction) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-red-500 text-center">{error || 'Auction not found'}</div>
      </div>
    );
  }

  const timeLeft = formatDistanceToNow(new Date(auction.end_date), { addSuffix: true });
  const isActive = auction.status === 'active' && new Date(auction.end_date) > new Date();

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{auction.product.name}</CardTitle>
              <CardDescription>
                by {auction.artisan.business_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video relative mb-4">
                <img
                  src={'http://localhost:8000/storage/' + auction.product.images.find(img => img.is_primary)?.path || auction.product.images[0]?.path}
                  alt={auction.product.name}
                  className="object-cover w-full h-full rounded-md"
                />
              </div>
              <div className="prose max-w-none">
                <p>{auction.product.description}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Auction Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-2xl font-bold">
                  Current Bid: ${highestBid !== null ? highestBid.toFixed(2) : 'Loading...'}
                </p>
                <p className="text-sm text-gray-500">
                  {auction.bid_count} bids
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Started: {format(new Date(auction.start_date), 'PPp')}
                </p>
                <p className="text-sm text-gray-500">
                  Ends: {format(new Date(auction.end_date), 'PPp')}
                </p>
                <p className="text-sm text-gray-500">
                  Time Left: {timeLeft}
                </p>
              </div>

              {isActive && (
                <form onSubmit={handleBidSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bidAmount">Your Bid</Label>
                    <Input
                      id="bidAmount"
                      type="number"
                      step="0.01"
                      min={parseFloat(auction.price) + parseFloat(auction.bid_increment)}
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder={`Minimum bid: $${(parseFloat(auction.price) + parseFloat(auction.bid_increment))}`}
                      required
                    />
                  </div>

                  {bidError && (
                    <Alert variant="destructive">
                      <AlertDescription>{bidError}</AlertDescription>
                    </Alert>
                  )}

                  {bidSuccess && (
                    <Alert>
                      <AlertDescription>{bidSuccess}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={placingBid || !isActive}
                  >
                    {placingBid ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Placing Bid...
                      </>
                    ) : (
                      'Place Bid'
                    )}
                  </Button>
                </form>
              )}

              {!isActive && auction && (
                <Alert>
                  <AlertDescription>
                    This auction has {auction.status === 'ended' ? `ended. Final Price: $${auction.price}` : auction.status === 'pending' ? 'not started yet.' : 'concluded.'}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Bid History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bids.map((bid) => (
                  <div key={bid.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{bid.user?.name ?? 'Unknown Bidder'}</p>
                      <p className="text-sm text-gray-500">
                        {bid.created_at ? format(new Date(bid.created_at), 'PPp') : 'Date unknown'}
                      </p>
                    </div>
                    <p className="font-bold">${bid.amount}</p>
                  </div>
                ))}
                {bids.length === 0 && (
                  <p className="text-gray-500 text-center">No bids yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuctionDetailPage;
