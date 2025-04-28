import React, { useState, useEffect } from 'react';
import api, { makeRequest } from '@/lib/axois';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, Calendar, Clock, DollarSign, ChevronUp } from 'lucide-react';
import { format, setHours, setMinutes, getHours, getMinutes } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { FormMessage } from '@/components/ui/form';

interface Product {
  id: number;
  name: string;
  status: string;
  images: {
    id: number;
    path: string;
    is_primary: boolean;
  }[];
}

const CreateAuctionPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [productId, setProductId] = useState<string>('');
  const [reservePrice, setReservePrice] = useState<string>('10.00');
  const [bidIncrement, setBidIncrement] = useState<string>('1.00');
  const [quantity, setQuantity] = useState<string>('1');
  
  const [startNow, setStartNow] = useState<boolean>(false);
  const [endAfter24h, setEndAfter24h] = useState<boolean>(false);
  
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [startHour, setStartHour] = useState<string>("14"); 
  const [startMinute, setStartMinute] = useState<string>("00");
  
  const [endDate, setEndDate] = useState<Date | undefined>(
    new Date(new Date().setDate(new Date().getDate() + 7)) 
  );
  const [endHour, setEndHour] = useState<string>("14"); 
  const [endMinute, setEndMinute] = useState<string>("00");
  
  const [isVisible, setIsVisible] = useState<boolean>(true);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetchingProducts, setIsFetchingProducts] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchProducts = async () => {
      setIsFetchingProducts(true);
      setError(null);
      
      try {
        const response = await makeRequest<Product[]>(api.get('/artisan/products'));
        
        if (response.success && Array.isArray(response.data)) {
          const availableProducts = response.data.filter(product => 
            product.status === 'active' && 
            product.images.some(img => img.is_primary)
          );
          setProducts(availableProducts);
        } else {
          setError('Failed to load products. Please try again.');
          console.error("Fetch products error:", response.error);
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        setError('An unexpected error occurred while loading your products.');
      } finally {
        setIsFetchingProducts(false);
      }
    };
    
    fetchProducts();
  }, []);
  
  useEffect(() => {
    if (startNow) {
      const now = new Date();
      setStartDate(now);
      setStartHour(now.getHours().toString());
      setStartMinute(now.getMinutes().toString());
      
      if (endAfter24h) {
        const endDateTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        setEndDate(endDateTime);
        setEndHour(endDateTime.getHours().toString());
        setEndMinute(endDateTime.getMinutes().toString());
      }
    }
  }, [startNow, endAfter24h]);
  
  useEffect(() => {
    if (endAfter24h && startDate) {
      const startDateTime = getDateWithTime(startDate, startHour, startMinute) || new Date();
      const endDateTime = new Date(startDateTime.getTime() + 24 * 60 * 60 * 1000);
      setEndDate(endDateTime);
      setEndHour(endDateTime.getHours().toString());
      setEndMinute(endDateTime.getMinutes().toString());
    }
  }, [endAfter24h, startDate, startHour, startMinute]);

  const getDateWithTime = (date: Date | undefined, hour: string, minute: string): Date | null => {
    if (!date) return null;
    
    const hourNum = hour ? parseInt(hour, 10) : 0;
    const minuteNum = minute ? parseInt(minute, 10) : 0;
    
    if (isNaN(hourNum) || hourNum < 0 || hourNum > 23 || 
        isNaN(minuteNum) || minuteNum < 0 || minuteNum > 59) {
      return null; 
    }
    
    const newDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    
    newDate.setHours(hourNum);
    newDate.setMinutes(minuteNum);
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);
    
    return newDate;
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!productId) {
      errors.productId = 'Please select a product';
    }
    
    if (!reservePrice || parseFloat(reservePrice) <= 0) {
      errors.reservePrice = 'Please enter a valid reserve price';
    }
    
    if (!bidIncrement || parseFloat(bidIncrement) <= 0) {
      errors.bidIncrement = 'Please enter a valid bid increment';
    }
    
    if (!quantity || parseInt(quantity) <= 0) {
      errors.quantity = 'Please enter a valid quantity (minimum 1)';
    }
    
    if (!startNow) {
      if (!startDate) {
        errors.startDate = 'Please select a start date';
      }
      
      const startHourNum = parseInt(startHour, 10);
      const startMinuteNum = parseInt(startMinute, 10);
      
      if (isNaN(startHourNum) || startHourNum < 0 || startHourNum > 23) {
        errors.startHour = 'Hour must be between 0-23';
      }
      
      if (isNaN(startMinuteNum) || startMinuteNum < 0 || startMinuteNum > 59) {
        errors.startMinute = 'Minute must be between 0-59';
      }
    }
    
    if (!endAfter24h) {
      if (!endDate) {
        errors.endDate = 'Please select an end date';
      }
      
      const endHourNum = parseInt(endHour, 10);
      const endMinuteNum = parseInt(endMinute, 10);
      
      if (isNaN(endHourNum) || endHourNum < 0 || endHourNum > 23) {
        errors.endHour = 'Hour must be between 0-23';
      }
      
      if (isNaN(endMinuteNum) || endMinuteNum < 0 || endMinuteNum > 59) {
        errors.endMinute = 'Minute must be between 0-59';
      }
    }
    
    let startDateTime: Date | null;
    let endDateTime: Date | null;
    const now = new Date();
    
    if (startNow) {
      startDateTime = now;
    } else {
      startDateTime = getDateWithTime(startDate, startHour, startMinute);
      if (startDateTime && startDateTime < now) {
        errors.startTime = 'Start time must be in the future';
      }
    }
    
    if (endAfter24h && startDateTime) {
      endDateTime = new Date(startDateTime.getTime() + 24 * 60 * 60 * 1000);
    } else {
      endDateTime = getDateWithTime(endDate, endHour, endMinute);
    }
    
    if (startDateTime && endDateTime && endDateTime <= startDateTime) {
      errors.endTime = 'End date/time must be after start date/time';
    }
    
    if (startDateTime && endDateTime) {
      const durationHours = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60);
      
      if (durationHours < 24) {
        errors.endTime = 'Auction must run for at least 24 hours (1 day)';
      }
      
      if (durationHours > 720) {
        errors.endTime = 'Auction cannot run for more than 30 days';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    let startDateTime;
    let endDateTime;
    
    if (startNow) {
      startDateTime = new Date();
    } else {
      startDateTime = startDate ? getDateWithTime(startDate, startHour, startMinute) : null;
    }
    
    if (endAfter24h && startDateTime) {
      endDateTime = new Date(startDateTime.getTime() + 24 * 60 * 60 * 1000);
    } else {
      endDateTime = endDate ? getDateWithTime(endDate, endHour, endMinute) : null;
    }
    
    const auctionData = {
      product_id: parseInt(productId),
      reserve_price: parseFloat(reservePrice),
      bid_increment: parseFloat(bidIncrement),
      quantity: parseInt(quantity),
      start_date: startDateTime ? startDateTime.toISOString().slice(0, 19).replace('T', ' ') : '',
      end_date: endDateTime ? endDateTime.toISOString().slice(0, 19).replace('T', ' ') : '',
      start_now: startNow,
      end_after_24h: endAfter24h,
      is_visible: isVisible,
    };
    
    try {
      const response = await makeRequest(api.post('/artisan/auctions', auctionData));
      
      if (response.success) {
        navigate('/dashboard/my-auctions', { 
          state: { message: 'Auction created successfully!' } 
        });
      } else {
        if (response.status === 422 && response.error?.errors) {
          const serverErrors: Record<string, string> = {};
          
          console.log('Validation Error Object:', response.error);
          console.log('Error errors structure:', response.error.errors);
          
          Object.entries(response.error.errors).forEach(([field, messages]) => {
            if (Array.isArray(messages) && messages.length > 0) {
              const fieldMapping: Record<string, string> = {
                'start_date': 'startTime',
                'end_date': 'endTime',
                'product_id': 'productId',
                'reserve_price': 'reservePrice',
                'bid_increment': 'bidIncrement'
              };
              
              const formField = fieldMapping[field] || field;
              serverErrors[formField] = messages[0];
              
              setError(prev => prev ? `${prev}\n• ${field}: ${messages[0]}` : `Validation errors:\n• ${field}: ${messages[0]}`);
            }
          });
          
          setFormErrors(prevErrors => ({ ...prevErrors, ...serverErrors }));
        } else {
          setError(response.error?.message || 'Failed to create auction. Please try again.');
        }
      }
    } catch (err) {
      console.error("Error creating auction:", err);
      setError('An unexpected error occurred while creating your auction.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPrimaryImageUrl = (product: Product): string | null => {
    const primary = product.images.find(img => img.is_primary);
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
    return primary ? `${baseUrl}/storage/${primary.path}` : null;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Auction</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      )}
      
      {isFetchingProducts ? (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2">Loading your products...</p>
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Products Available</CardTitle>
            <CardDescription>
              You don't have any active products with primary images that can be auctioned.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>To create an auction, you need to:</p>
            <ol className="list-decimal list-inside space-y-2 my-4">
              <li>Create a product or activate an existing one</li>
              <li>Upload at least one image and set it as the primary image</li>
            </ol>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate('/dashboard/my-products/create')}>
              Create New Product
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Select Product</CardTitle>
              <CardDescription>
                Choose which product you want to auction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Select value={productId} onValueChange={setProductId}>
                  <SelectTrigger className={cn(formErrors.productId && "border-red-500")}>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={String(product.id)}>
                        <div className="flex items-center">
                          {getPrimaryImageUrl(product) && (
                            <div className="w-8 h-8 bg-gray-200 rounded mr-2 overflow-hidden">
                              <img 
                                src={getPrimaryImageUrl(product)!} 
                                alt={product.name} 
                                className="w-full h-full object-cover" 
                              />
                            </div>
                          )}
                          <span>{product.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.productId && (
                  <p className="text-sm text-red-500">{formErrors.productId}</p>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Auction Details</CardTitle>
              <CardDescription>
                Set up the pricing and timing for your auction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="reservePrice">
                      Reserve Price <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative mt-1">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="reservePrice"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={reservePrice}
                        onChange={(e) => setReservePrice(e.target.value)}
                        className={cn("pl-9", formErrors.reservePrice && "border-red-500")}
                      />
                    </div>
                    {formErrors.reservePrice && (
                      <p className="text-sm text-red-500">{formErrors.reservePrice}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      Minimum price you are willing to accept
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="bidIncrement">
                      Bid Increment <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative mt-1">
                      <ChevronUp className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="bidIncrement"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={bidIncrement}
                        onChange={(e) => setBidIncrement(e.target.value)}
                        className={cn("pl-9", formErrors.bidIncrement && "border-red-500")}
                      />
                    </div>
                    {formErrors.bidIncrement && (
                      <p className="text-sm text-red-500">{formErrors.bidIncrement}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      Minimum amount each new bid must increase by
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="quantity">
                      Quantity <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        id="quantity"
                        type="number"
                        step="1"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className={cn(formErrors.quantity && "border-red-500")}
                      />
                    </div>
                    {formErrors.quantity && (
                      <p className="text-sm text-red-500">{formErrors.quantity}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      Number of items to auction
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="startDate">
                      Start Date & Time <span className="text-red-500">*</span>
                    </Label>
                    <div className="mt-1 space-y-2">
                      <div className="flex items-center space-x-2 mb-2">
                        <Checkbox
                          id="startNow"
                          checked={startNow}
                          onCheckedChange={(checked) => setStartNow(checked as boolean)}
                        />
                        <Label htmlFor="startNow" className="cursor-pointer">
                          Start Now
                        </Label>
                        <div className="text-sm text-muted-foreground">(Auction will start immediately)</div>
                      </div>
                    
                      {!startNow && (
                        <>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button 
                                variant="outline" 
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !startDate && "text-muted-foreground",
                                  formErrors.startDate && "border-red-500"
                                )}
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <CalendarComponent
                                mode="single"
                                selected={startDate}
                                onSelect={setStartDate}
                                initialFocus
                                disabled={(date) => date < new Date()}
                              />
                            </PopoverContent>
                          </Popover>
                          
                          <div className="flex items-center space-x-2 mt-2">
                            <div className="flex-1">
                              <Label htmlFor="startHour">Hour (0-23)</Label>
                              <Input
                                id="startHour"
                                type="number"
                                min="0"
                                max="23"
                                value={startHour}
                                onChange={(e) => setStartHour(e.target.value)}
                                placeholder="14"
                                className={cn(formErrors.startHour && "border-red-500")}
                              />
                              {formErrors.startHour && (
                                <p className="text-sm text-red-500">{formErrors.startHour}</p>
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <Label htmlFor="startMinute">Minute (0-59)</Label>
                              <Input
                                id="startMinute"
                                type="number"
                                min="0"
                                max="59"
                                value={startMinute}
                                onChange={(e) => setStartMinute(e.target.value)}
                                placeholder="00"
                                className={cn(formErrors.startMinute && "border-red-500")}
                              />
                              {formErrors.startMinute && (
                                <p className="text-sm text-red-500">{formErrors.startMinute}</p>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                      
                      {startNow && (
                        <div className="text-sm text-muted-foreground italic my-2 p-2 bg-muted rounded">
                          Date and time inputs are disabled as the auction will start immediately upon creation
                        </div>
                      )}
                    </div>
                    {formErrors.startDate && (
                      <p className="text-sm text-red-500">{formErrors.startDate}</p>
                    )}
                    {formErrors.startTime && (
                      <p className="text-sm text-red-500">{formErrors.startTime}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="endDate">
                      End Date & Time <span className="text-red-500">*</span>
                    </Label>
                    <div className="mt-1 space-y-2">
                      <div className="flex items-center space-x-2 mb-2">
                        <Checkbox
                          id="endAfter24h"
                          checked={endAfter24h}
                          onCheckedChange={(checked) => {
                            setEndAfter24h(!!checked);
                            if (checked) {
                              const start = startNow ? new Date() : getDateWithTime(startDate, startHour, startMinute);
                              if (start) {
                                const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
                                setEndDate(end);
                                setEndHour(end.getHours().toString().padStart(2, '0'));
                                setEndMinute(end.getMinutes().toString().padStart(2, '0'));
                              }
                            }
                          }}
                        />
                        <Label htmlFor="endAfter24h" className="cursor-pointer">
                          End After 24 Hours
                        </Label>
                        <div className="text-sm text-muted-foreground">(From start time)</div>
                      </div>

                      {!endAfter24h && (
                        <>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button 
                                variant="outline" 
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !endDate && "text-muted-foreground",
                                  formErrors.endDate && "border-red-500"
                                )}
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <CalendarComponent
                                mode="single"
                                selected={endDate}
                                onSelect={setEndDate}
                                initialFocus
                                disabled={(date) => date < new Date()}
                              />
                            </PopoverContent>
                          </Popover>
                          
                          <div className="flex items-center space-x-2 mt-2">
                            <div className="flex-1">
                              <Label htmlFor="endHour">Hour (0-23)</Label>
                              <Input
                                id="endHour"
                                type="number"
                                min="0"
                                max="23"
                                value={endHour}
                                onChange={(e) => setEndHour(e.target.value)}
                                placeholder="14"
                                className={cn(formErrors.endHour && "border-red-500")}
                              />
                              {formErrors.endHour && (
                                <p className="text-sm text-red-500">{formErrors.endHour}</p>
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <Label htmlFor="endMinute">Minute (0-59)</Label>
                              <Input
                                id="endMinute"
                                type="number"
                                min="0"
                                max="59"
                                value={endMinute}
                                onChange={(e) => setEndMinute(e.target.value)}
                                placeholder="00"
                                className={cn(formErrors.endMinute && "border-red-500")}
                              />
                              {formErrors.endMinute && (
                                <p className="text-sm text-red-500">{formErrors.endMinute}</p>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                      
                      {endAfter24h && (
                        <div className="text-sm text-muted-foreground italic my-2 p-2 bg-muted rounded">
                          The auction will end exactly 24 hours after it starts
                        </div>
                      )}
                    </div>
                    {formErrors.endDate && (
                      <p className="text-sm text-red-500">{formErrors.endDate}</p>
                    )}
                    {formErrors.endTime && (
                      <p className="text-sm text-red-500">{formErrors.endTime}</p>
                    )}
                  </div>
                </div>
                
                <div className="bg-muted p-3 rounded-md mt-4">
                  <h4 className="text-sm font-medium mb-1">Auction Rules:</h4>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                    <li>Duration: Auctions must run for at least 24 hours (1 day)</li>
                    <li>Duration: Auctions cannot run for more than 30 days</li>
                    <li>Scheduling: You can start an auction immediately or schedule it up to one week in advance</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Auction Options</CardTitle>
              <CardDescription>
                Configure additional settings for your auction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isVisible"
                    checked={isVisible}
                    onCheckedChange={(checked) => setIsVisible(checked as boolean)}
                  />
                  <Label htmlFor="isVisible" className="cursor-pointer">
                    Publicly Visible
                  </Label>
                </div>
                <p className="text-sm text-gray-500">
                  If unchecked, the auction will not be visible in public listings
                </p>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/dashboard/my-auctions')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Auction'
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CreateAuctionPage;
