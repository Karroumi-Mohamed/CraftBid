import React, { useState, useEffect } from 'react';
import api, { makeRequest } from '@/lib/axois';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import { 
  PlusCircle, 
  AlertCircle, 
  Loader2, 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  User, 
  Eye, 
  Ban,
  Check,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';

interface ProductImage {
  id: number;
  path: string;
  is_primary: boolean;
}

interface Product {
  id: number;
  name: string;
  description: string;
  images: ProductImage[];
}

interface Auction {
  id: number;
  artisan_id: number;
  product_id: number;
  reserve_price: number;
  price: number | null;
  bid_increment: number;
  bid_count: number;
  quantity: number;
  anti_sniping: boolean;
  start_date: string;
  end_date: string;
  status: 'pending' | 'active' | 'ended' | 'cancelled';
  winner_id: number | null;
  type: 'standard' | 'featured';
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  product: Product;
  winner?: {
    id: number;
    name: string;
    email: string;
  };
}

const ArtisanAuctionsPage: React.FC = () => {
  const location = useLocation();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    location.state?.message || null
  );
  const [activeTab, setActiveTab] = useState<string>("all");
  
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState<boolean>(false);
  const [selectedAuctionId, setSelectedAuctionId] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  useEffect(() => {
    fetchAuctions();
  }, []);

  const fetchAuctions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await makeRequest<Auction[]>(api.get('/artisan/auctions'));
      
      if (response.success && Array.isArray(response.data)) {
        setAuctions(response.data);
      } else {
        setError(response.error?.message || 'Failed to load auctions');
        console.error("Fetch auctions error:", response.error);
      }
    } catch (err) {
      console.error("Error fetching auctions:", err);
      setError('An unexpected error occurred while loading your auctions.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelAuction = async () => {
    if (!selectedAuctionId) return;
    
    setIsCancelling(true);
    
    try {
      const response = await makeRequest(
        api.post(`/artisan/auctions/${selectedAuctionId}/cancel`)
      );
      
      if (response.success) {
        setAuctions(auctions.map(auction => 
          auction.id === selectedAuctionId
            ? { ...auction, status: 'cancelled' }
            : auction
        ));
        
        setSuccessMessage('Auction cancelled successfully.');
        
        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);
      } else {
        setError(response.error?.message || 'Failed to cancel auction.');
      }
    } catch (err) {
      console.error("Error cancelling auction:", err);
      setError('An unexpected error occurred while cancelling the auction.');
    } finally {
      setIsCancelling(false);
      setIsConfirmDialogOpen(false);
      setSelectedAuctionId(null);
    }
  };

  const openCancelDialog = (auctionId: number) => {
    setSelectedAuctionId(auctionId);
    setIsConfirmDialogOpen(true);
  };
  
  const toggleVisibility = async (auctionId: number, currentVisibility: boolean) => {
    try {
      setIsLoading(true);
      const response = await makeRequest(
        api.patch(`/artisan/auctions/${auctionId}/toggle-visibility`)
      );
      
      if (response.success) {
        setAuctions(auctions.map(auction => 
          auction.id === auctionId
            ? { ...auction, is_visible: !currentVisibility }
            : auction
        ));
        
        setSuccessMessage(`Auction is now ${!currentVisibility ? 'visible' : 'hidden'} to buyers.`);
        
        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);
      } else {
        setError(response.error?.message || 'Failed to update auction visibility.');
      }
    } catch (err) {
      console.error("Error toggling auction visibility:", err);
      setError('An unexpected error occurred while updating visibility.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString || typeof dateString !== 'string') {
      return 'Invalid date';
    }
    
    try {
      const [datePart, timePart] = dateString.split(' ');
      
      if (!datePart || !timePart) {
        return format(new Date(dateString), 'MMM d, yyyy HH:mm');
      }
      
      const [year, month, day] = datePart.split('-').map(Number);
      const [hour, minute] = timePart.split(':').map(Number);
      
      if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute)) {
        return format(new Date(dateString), 'MMM d, yyyy HH:mm');
      }
      
      const date = new Date(year, month - 1, day, hour, minute);
      
      return format(date, 'MMM d, yyyy HH:mm');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString || 'Invalid date';
    }
  };

  const getPrimaryImageUrl = (product: Product): string | null => {
    const primary = product.images.find(img => img.is_primary);
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
    return primary ? `${baseUrl}/storage/${primary.path}` : null;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500">Upcoming</Badge>;
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'ended':
        return <Badge className="bg-blue-500">Ended</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredAuctions = auctions.filter(auction => {
    if (activeTab === "all") return true;
    return auction.status === activeTab;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Auctions</h1>
        <Link to="/dashboard/my-auctions/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Create Auction
          </Button>
        </Link>
      </div>

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 flex items-center">
          <Check className="h-5 w-5 mr-2" />
          <span>{successMessage}</span>
          <button
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => setSuccessMessage(null)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{error}</span>
          <button
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => setError(null)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Upcoming</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="ended">Ended</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2">Loading your auctions...</p>
        </div>
      ) : auctions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Auctions Found</CardTitle>
            <CardDescription>
              You haven't created any auctions yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Start by creating a new auction for one of your products.</p>
            <Link to="/dashboard/my-auctions/create">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Create Your First Auction
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : filteredAuctions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No {activeTab === 'all' ? '' : activeTab} auctions found
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Bids</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAuctions.map((auction) => (
              <TableRow key={auction.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden">
                      {getPrimaryImageUrl(auction.product) ? (
                        <img 
                          src={getPrimaryImageUrl(auction.product)!}
                          alt={auction.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <span className="text-xs">No img</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{auction.product.name}</div>
                      {auction.type === 'featured' && (
                        <Badge variant="outline" className="text-xs">Featured</Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(auction.status)}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 text-gray-500 mr-1" />
                    {auction.price || auction.reserve_price}
                  </div>
                </TableCell>
                <TableCell>{auction.quantity || 1}</TableCell>
                <TableCell>{auction.bid_count}</TableCell>
                <TableCell>
                  <div className="whitespace-nowrap">
                    {formatDate(auction.start_date)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="whitespace-nowrap">
                    {formatDate(auction.end_date)}
                  </div>
                </TableCell>
                <TableCell>
                  {auction.is_visible ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
                      <Eye className="h-3 w-3" /> Visible
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200 flex items-center gap-1">
                      <X className="h-3 w-3" /> Hidden
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    {/* View auction page */}
                    <Link to={`/auctions/${auction.id}`} target="_blank">
                      <Button size="icon" variant="ghost" title="View auction page">
                        <Eye className="h-4 w-4 text-blue-500" />
                      </Button>
                    </Link>
                    
                    <Button
                      size="icon"
                      variant="ghost"
                      title={auction.is_visible ? "Hide auction" : "Make visible"}
                      onClick={() => toggleVisibility(auction.id, auction.is_visible)}
                      disabled={isLoading}
                    >
                      {auction.is_visible ? (
                        <X className="h-4 w-4 text-amber-500" />
                      ) : (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                    </Button>
                    
                    {auction.status === 'pending' && (
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Cancel auction"
                        onClick={() => openCancelDialog(auction.id)}
                      >
                        <Ban className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to cancel this auction?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The auction will be marked as cancelled and won't be visible to buyers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelAuction}
              disabled={isCancelling}
              className="bg-red-500 hover:bg-red-600"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Yes, Cancel Auction"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ArtisanAuctionsPage;
