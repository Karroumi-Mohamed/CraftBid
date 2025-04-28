import React, { useState, useEffect } from 'react';
import api, { makeRequest } from '@/lib/axois';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search, Star, AlertCircle, Check, AlertTriangle, Eye, X, Ban, Play, Pause, StarOff } from 'lucide-react';

// Define interfaces for the data structures
interface Product {
  id: number;
  name: string;
  images: ProductImage[];
}

interface ProductImage {
  id: number;
  path: string;
  is_primary: boolean;
}

interface Artisan {
  id: number;
  user: User;
}

interface User {
  id: number;
  name: string;
  email: string;
}

interface Auction {
  id: number;
  product: Product;
  artisan: Artisan;
  price: number;
  reserve_price: number;
  bid_increment: number;
  bid_count: number;
  quantity: number;
  start_date: string;
  end_date: string;
  status: 'pending' | 'active' | 'ended' | 'cancelled';
  type: 'standard' | 'featured';
  is_visible: boolean;
}

interface Pagination {
  current_page: number;
  per_page: number;
  last_page: number;
  total: number;
}

const AuctionBadge = ({ status }: { status: string }) => {
  let color;
  let icon;
  
  switch (status) {
    case 'pending':
      color = 'bg-yellow-100 text-yellow-800 border-yellow-200';
      icon = <AlertTriangle className="h-3 w-3 mr-1" />;
      break;
    case 'active':
      color = 'bg-green-100 text-green-800 border-green-200';
      icon = <Check className="h-3 w-3 mr-1" />;
      break;
    case 'ended':
      color = 'bg-blue-100 text-blue-800 border-blue-200';
      icon = <Pause className="h-3 w-3 mr-1" />;
      break;
    case 'cancelled':
      color = 'bg-red-100 text-red-800 border-red-200';
      icon = <X className="h-3 w-3 mr-1" />;
      break;
    default:
      color = 'bg-gray-100 text-gray-800 border-gray-200';
      icon = null;
  }
  
  return (
    <Badge variant="outline" className={`${color} flex items-center`}>
      {icon}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

const AdminAuctionManagementPage = () => {
  // State
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionInProgress, setActionInProgress] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    current_page: 1,
    per_page: 10,
    last_page: 1,
    total: 0,
  });
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Selected item for actions
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [isEndDialogOpen, setIsEndDialogOpen] = useState<boolean>(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  
  // Fetch auctions with pagination and filters
  const fetchAuctions = async (page = 1) => {
    setLoading(true);
    setError(null);
    
    let queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    
    if (statusFilter) {
      queryParams.append('status', statusFilter);
    }
    
    if (typeFilter) {
      queryParams.append('type', typeFilter);
    }
    
    if (searchQuery) {
      queryParams.append('search', searchQuery);
    }
    
    try {
      const response = await makeRequest(
        api.get(`/admin/auctions?${queryParams.toString()}`)
      );
      
      if (response.success && response.data) {
        setAuctions(response.data.data);
        setPagination({
          current_page: response.data.current_page,
          per_page: response.data.per_page,
          last_page: response.data.last_page,
          total: response.data.total,
        });
      } else {
        setError(response.error?.message || 'Failed to load auctions');
      }
    } catch (err) {
      console.error("Error fetching auctions:", err);
      setError('An unexpected error occurred while loading auctions');
    } finally {
      setLoading(false);
    }
  };
  
  // Initial load
  useEffect(() => {
    fetchAuctions();
  }, []);
  
  // Toggle featured status
  const handleToggleFeatured = async (auction: Auction) => {
    setActionInProgress(true);
    try {
      const response = await makeRequest(
        api.patch(`/admin/auctions/${auction.id}/toggle-featured`)
      );
      
      if (response.success) {
        setSuccessMessage(
          auction.type === 'featured' 
            ? `Auction #${auction.id} is no longer featured` 
            : `Auction #${auction.id} is now featured`
        );
        fetchAuctions(pagination.current_page); // Refresh the list
      } else {
        setError(response.error?.message || 'Failed to update featured status');
      }
    } catch (err) {
      console.error("Error toggling featured status:", err);
      setError('An unexpected error occurred');
    } finally {
      setActionInProgress(false);
    }
  };
  
  // End auction early
  const handleEndAuction = async () => {
    if (!selectedAuction) return;
    
    setActionInProgress(true);
    try {
      const response = await makeRequest(
        api.patch(`/admin/auctions/${selectedAuction.id}/end`)
      );
      
      if (response.success) {
        setSuccessMessage(`Auction #${selectedAuction.id} has been ended`);
        fetchAuctions(pagination.current_page); // Refresh the list
      } else {
        setError(response.error?.message || 'Failed to end auction');
      }
    } catch (err) {
      console.error("Error ending auction:", err);
      setError('An unexpected error occurred');
    } finally {
      setActionInProgress(false);
      setIsEndDialogOpen(false);
    }
  };
  
  // Cancel auction
  const handleCancelAuction = async () => {
    if (!selectedAuction) return;
    
    setActionInProgress(true);
    try {
      const response = await makeRequest(
        api.patch(`/admin/auctions/${selectedAuction.id}/cancel`)
      );
      
      if (response.success) {
        setSuccessMessage(`Auction #${selectedAuction.id} has been cancelled`);
        fetchAuctions(pagination.current_page); // Refresh the list
      } else {
        setError(response.error?.message || 'Failed to cancel auction');
      }
    } catch (err) {
      console.error("Error cancelling auction:", err);
      setError('An unexpected error occurred');
    } finally {
      setActionInProgress(false);
      setIsCancelDialogOpen(false);
    }
  };
  
  // Delete auction
  const handleDeleteAuction = async () => {
    if (!selectedAuction) return;
    
    setActionInProgress(true);
    try {
      const response = await makeRequest(
        api.delete(`/admin/auctions/${selectedAuction.id}`)
      );
      
      if (response.success) {
        setSuccessMessage(`Auction #${selectedAuction.id} has been deleted`);
        fetchAuctions(pagination.current_page); // Refresh the list
      } else {
        setError(response.error?.message || 'Failed to delete auction');
      }
    } catch (err) {
      console.error("Error deleting auction:", err);
      setError('An unexpected error occurred');
    } finally {
      setActionInProgress(false);
      setIsDeleteDialogOpen(false);
    }
  };
  
  // Apply filters
  const applyFilters = () => {
    fetchAuctions(1);
  };
  
  // Reset filters
  const resetFilters = () => {
    setStatusFilter(null);
    setTypeFilter(null);
    setSearchQuery('');
    fetchAuctions(1);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  // Function to toggle auction visibility
  const toggleVisibility = async (auctionId: number, currentVisibility: boolean) => {
    setActionInProgress(true);
    try {
      const response = await makeRequest(
        api.patch(`/admin/auctions/${auctionId}`, { is_visible: !currentVisibility })
      );
      
      if (response.success) {
        setSuccessMessage(`Auction #${auctionId} visibility updated`);
        fetchAuctions(pagination.current_page); // Refresh the list
      } else {
        setError(response.error?.message || 'Failed to update auction visibility');
      }
    } catch (err) {
      console.error("Error toggling auction visibility:", err);
      setError('An unexpected error occurred');
    } finally {
      setActionInProgress(false);
    }
  };
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Auction Management</h1>
      
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 flex items-center">
          <Check className="h-5 w-5 mr-2" />
          <span>{successMessage}</span>
          <button 
            className="absolute top-0 right-0 p-2" 
            onClick={() => setSuccessMessage(null)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{error}</span>
          <button 
            className="absolute top-0 right-0 p-2" 
            onClick={() => setError(null)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      
      {/* Filter Panel */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm mb-1">Status</label>
              <Select 
                value={statusFilter || 'all'} 
                onValueChange={(value) => setStatusFilter(value === 'all' ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="ended">Ended</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm mb-1">Type</label>
              <Select 
                value={typeFilter || 'all'} 
                onValueChange={(value) => setTypeFilter(value === 'all' ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search by product name or ID" 
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex items-end gap-2">
              <Button 
                onClick={applyFilters} 
                disabled={loading || actionInProgress}
                className="flex-1"
              >
                Apply Filters
              </Button>
              <Button 
                onClick={resetFilters} 
                variant="outline" 
                disabled={loading || actionInProgress}
                className="flex-1"
              >
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Auctions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableCaption>
            {loading ? "Loading auctions..." : `${pagination.total} auctions found`}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Artisan</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Bids</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : auctions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  No auctions found
                </TableCell>
              </TableRow>
            ) : (
              auctions.map((auction) => (
                <TableRow key={auction.id}>
                  <TableCell>#{auction.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {auction.product.images.find((img) => img.is_primary) && (
                        <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-100">
                          <img 
                            src={`${import.meta.env.VITE_API_BASE_URL}/storage/${auction.product.images.find((img) => img.is_primary)?.path}`} 
                            alt={auction.product.name} 
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <span className="font-medium">{auction.product.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{auction.artisan.user.name}</TableCell>
                  <TableCell>
                    ${auction.price} 
                    <span className="text-xs text-gray-500">
                      (min: ${auction.reserve_price})
                    </span>
                  </TableCell>
                  <TableCell>{auction.bid_count}</TableCell>
                  <TableCell>{formatDate(auction.start_date)}</TableCell>
                  <TableCell>{formatDate(auction.end_date)}</TableCell>
                  <TableCell>
                    <AuctionBadge status={auction.status} />
                  </TableCell>
                  <TableCell>
                    {auction.type === 'featured' ? (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200 flex items-center">
                        <Star className="h-3 w-3 mr-1 text-yellow-500" /> Featured
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                        Standard
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center space-x-1">
                      {/* View */}
                      <Button
                        size="icon"
                        variant="ghost"
                        title="View Auction Details"
                        onClick={() => {
                          // Navigate to auction details or open modal
                        }}
                        disabled={actionInProgress}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {/* Toggle featured */}
                      <Button
                        size="icon"
                        variant="ghost"
                        title={auction.type === 'featured' ? "Remove from Featured" : "Mark as Featured"}
                        onClick={() => handleToggleFeatured(auction)}
                        disabled={actionInProgress}
                      >
                        {auction.type === 'featured' ? (
                          <StarOff className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <Star className="h-4 w-4" />
                        )}
                      </Button>
                      
                      {/* End Auction (only for active auctions) */}
                      {auction.status === 'active' && (
                        <Button
                          size="icon"
                          variant="ghost"
                          title="End Auction Now"
                          onClick={() => {
                            setSelectedAuction(auction);
                            setIsEndDialogOpen(true);
                          }}
                          disabled={actionInProgress}
                        >
                          <Pause className="h-4 w-4 text-blue-500" />
                        </Button>
                      )}
                      
                      {/* Cancel Auction (only for pending or active auctions) */}
                      {['pending', 'active'].includes(auction.status) && (
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Cancel Auction"
                          onClick={() => {
                            setSelectedAuction(auction);
                            setIsCancelDialogOpen(true);
                          }}
                          disabled={actionInProgress}
                        >
                          <Ban className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                      
                      {/* Delete Auction */}
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Delete Auction"
                        onClick={() => {
                          setSelectedAuction(auction);
                          setIsDeleteDialogOpen(true);
                        }}
                        disabled={actionInProgress}
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                      
                      {/* Toggle visibility */}
                      <Button
                        size="icon"
                        variant="ghost"
                        title={auction.is_visible ? "Hide Auction" : "Show Auction"}
                        onClick={() => toggleVisibility(auction.id, auction.is_visible)}
                        disabled={actionInProgress}
                      >
                        {auction.is_visible ? (
                          <Eye className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Ban className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-t">
            <div className="text-sm text-gray-500">
              Showing {auctions.length} of {pagination.total} auctions
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchAuctions(pagination.current_page - 1)}
                disabled={pagination.current_page === 1 || loading || actionInProgress}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchAuctions(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.last_page || loading || actionInProgress}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* End Auction Confirmation Dialog */}
      <AlertDialog open={isEndDialogOpen} onOpenChange={setIsEndDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Auction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end this auction now? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionInProgress}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleEndAuction();
              }}
              disabled={actionInProgress}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {actionInProgress ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ending...
                </>
              ) : (
                "End Auction"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Cancel Auction Confirmation Dialog */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Auction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this auction? Existing bids will be invalidated and the auction will no longer be visible to users.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionInProgress}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleCancelAuction();
              }}
              disabled={actionInProgress}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {actionInProgress ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Cancel Auction"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Delete Auction Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Auction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this auction? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionInProgress}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDeleteAuction();
              }}
              disabled={actionInProgress}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {actionInProgress ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Auction"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminAuctionManagementPage;
