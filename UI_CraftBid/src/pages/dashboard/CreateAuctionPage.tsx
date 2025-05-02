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
import { format, setHours, setMinutes, getHours, getMinutes, addMinutes, differenceInMinutes, isBefore, startOfDay } from 'date-fns';
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

interface AuctionDurationSettings {
  min: number; 
  max: number; 
  default: number; 
}

const CreateAuctionPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [productId, setProductId] = useState<string>('');
  const [reservePrice, setReservePrice] = useState<string>('10.00');
  const [bidIncrement, setBidIncrement] = useState<string>('1.00');
  const [quantity, setQuantity] = useState<string>('1');
  
  const [startNow, setStartNow] = useState<boolean>(false);
  const [endAfterDefault, setEndAfterDefault] = useState<boolean>(true); 
  
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [startHour, setStartHour] = useState<string>("14"); 
  const [startMinute, setStartMinute] = useState<string>("00");
  
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [endHour, setEndHour] = useState<string>("14"); 
  const [endMinute, setEndMinute] = useState<string>("00");
  
  const [isVisible, setIsVisible] = useState<boolean>(true);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetchingProducts, setIsFetchingProducts] = useState<boolean>(true);
  const [isFetchingSettings, setIsFetchingSettings] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [durationSettings, setDurationSettings] = useState<AuctionDurationSettings | null>(null);

  useEffect(() => {
    const fetchDurationSettings = async () => {
      setIsFetchingSettings(true);
      setSettingsError(null);
      try {
        const response = await makeRequest<AuctionDurationSettings>(api.get('/settings/auction-duration'));
        if (response.success && response.data) {
          setDurationSettings(response.data);
          const now = new Date();
          const defaultEndDate = addMinutes(now, response.data.default);
          setEndDate(defaultEndDate);
          setEndHour(defaultEndDate.getHours().toString().padStart(2, '0'));
          setEndMinute(defaultEndDate.getMinutes().toString().padStart(2, '0'));
          setEndAfterDefault(true);
        } else {
          console.error("Fetch duration settings error:", response.error);
          setSettingsError('Failed to load auction duration settings. Using defaults.');
          const fallbackSettings: AuctionDurationSettings = { min: 1, max: 14 * 24 * 60, default: 7 * 24 * 60 }; // Defaults in minutes
          setDurationSettings(fallbackSettings);
          const now = new Date();
          const fallbackEndDate = addMinutes(now, fallbackSettings.default);
          setEndDate(fallbackEndDate);
          setEndHour(fallbackEndDate.getHours().toString().padStart(2, '0'));
          setEndMinute(fallbackEndDate.getMinutes().toString().padStart(2, '0'));
          setEndAfterDefault(true);
        }
      } catch (err) {
        console.error("Error fetching duration settings:", err);
        setSettingsError('An error occurred while loading auction duration settings. Using defaults.');
        const fallbackSettings: AuctionDurationSettings = { min: 1, max: 14 * 24 * 60, default: 7 * 24 * 60 }; // Defaults in minutes
        setDurationSettings(fallbackSettings);
        const now = new Date();
        const fallbackEndDate = addMinutes(now, fallbackSettings.default);
        setEndDate(fallbackEndDate);
        setEndHour(fallbackEndDate.getHours().toString().padStart(2, '0'));
        setEndMinute(fallbackEndDate.getMinutes().toString().padStart(2, '0'));
        setEndAfterDefault(true);
      } finally {
        setIsFetchingSettings(false);
      }
    };
    fetchDurationSettings();
  }, []);

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
      const nowHour = now.getHours().toString().padStart(2, '0');
      const nowMinute = now.getMinutes().toString().padStart(2, '0');
      setStartDate(now);
      setStartHour(nowHour);
      setStartMinute(nowMinute);
    } 
  }, [startNow]); 

  useEffect(() => {
    if (!endAfterDefault || !durationSettings) {
      return; 
    }

    let baseStartTime: Date | null = null;
    if (startNow) {
        baseStartTime = new Date();
    } else if (startDate && startHour && startMinute) {
        baseStartTime = getDateWithTime(startDate, startHour, startMinute);
    }

    if (baseStartTime) {
      const newEndDateTime = addMinutes(baseStartTime, durationSettings.default);
      const newEndHour = newEndDateTime.getHours().toString().padStart(2, '0');
      const newEndMinute = newEndDateTime.getMinutes().toString().padStart(2, '0');

      if (endDate?.getTime() !== newEndDateTime.getTime()) {
        setEndDate(newEndDateTime);
      }
      if (endHour !== newEndHour) {
        setEndHour(newEndHour);
      }
      if (endMinute !== newEndMinute) {
        setEndMinute(newEndMinute);
      }
    }
  }, [startNow, startDate, startHour, startMinute, endAfterDefault, durationSettings]); 

  const getDateWithTime = (date: Date | undefined, hour: string, minute: string): Date | null => {
    if (!date) return null;
    
    const hourNum = hour ? parseInt(hour, 10) : 0;
    const minuteNum = minute ? parseInt(minute, 10) : 0;
    
    if (isNaN(hourNum) || hourNum < 0 || hourNum > 23 || 
        isNaN(minuteNum) || minuteNum < 0 || minuteNum > 59) {
      return null; 
    }
    
    const newDate = startOfDay(date);
    newDate.setHours(hourNum);
    newDate.setMinutes(minuteNum);
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);
    
    return newDate;
  };

  const formatDurationForMessage = (minutes: number): string => {
    if (minutes < 1) return "less than a minute";
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours < 24) {
      let msg = `${hours} hour${hours > 1 ? 's' : ''}`;
      if (remainingMinutes > 0) {
        msg += ` ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`;
      }
      return msg;
    }

    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    
    let msg = `${days} day${days > 1 ? 's' : ''}`;
    if (remainingHours > 0) {
      msg += ` ${remainingHours} hour${remainingHours > 1 ? 's' : ''}`;
    }
    if (remainingMinutes > 0) {
      msg += ` ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`;
    }
    return msg;
  };

  const calculateMinEndDate = (start: Date | null): Date | undefined => {
    if (!start || !durationSettings) return undefined;
    const minEnd = addMinutes(start, durationSettings.min);
    return startOfDay(minEnd);
  };

  const calculateMaxEndDate = (start: Date | null): Date | undefined => {
    if (!start || !durationSettings) return undefined;
    return addMinutes(start, durationSettings.max);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!productId) {
      errors.productId = 'Please select a product';
    }
    
    if (!reservePrice || parseFloat(reservePrice) <= 0) {
      errors.reservePrice = 'Please enter a valid reserve price (must be > 0)';
    }
    
    if (!bidIncrement || parseFloat(bidIncrement) <= 0) {
      errors.bidIncrement = 'Please enter a valid bid increment (must be > 0)';
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
    
    let startDateTime: Date | null;
    let endDateTime: Date | null;
    const now = new Date();
    
    if (startNow) {
      startDateTime = now;
    } else {
      startDateTime = getDateWithTime(startDate, startHour, startMinute);
      if (startDateTime && isBefore(startDateTime, addMinutes(now, -1))) { 
        errors.startTime = 'Start time cannot be in the past';
      }
    }
    
    endDateTime = getDateWithTime(endDate, endHour, endMinute);
    
    if (startDateTime && endDateTime && !isBefore(startDateTime, endDateTime)) { 
      errors.endTime = 'End date/time must be after start date/time';
    }
    
    if (startDateTime && endDateTime && durationSettings) {
      const durationMinutes = differenceInMinutes(endDateTime, startDateTime);
      
      if (durationMinutes < durationSettings.min) {
        errors.endTime = `Auction duration must be at least ${formatDurationForMessage(durationSettings.min)}. Current: ${formatDurationForMessage(durationMinutes)}.`;
      }
      
      if (durationMinutes > durationSettings.max) {
        errors.endTime = `Auction duration cannot exceed ${formatDurationForMessage(durationSettings.max)}. Current: ${formatDurationForMessage(durationMinutes)}.`;
      }
    } else if (!durationSettings && !isFetchingSettings) {
        errors.durationSettings = settingsError || 'Could not validate duration due to missing settings.';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isFetchingSettings) {
      setError("Please wait, loading auction settings...");
      return;
    }
    if (!durationSettings) {
      setError(settingsError || "Cannot create auction: Failed to load required settings.");
      return;
    }
    
    if (!validateForm()) {
      const firstErrorKey = Object.keys(formErrors)[0];
      if (firstErrorKey) {
          const element = document.getElementById(firstErrorKey);
          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    let startDateTime;
    if (startNow) {
      startDateTime = new Date();
    } else {
      startDateTime = startDate ? getDateWithTime(startDate, startHour, startMinute) : null;
    }
    
    let endDateTime = endDate ? getDateWithTime(endDate, endHour, endMinute) : null;
    
    const auctionData = {
      product_id: parseInt(productId),
      reserve_price: parseFloat(reservePrice),
      bid_increment: parseFloat(bidIncrement),
      quantity: parseInt(quantity),
      start_date: startDateTime ? startDateTime.toISOString() : '', 
      end_date: endDateTime ? endDateTime.toISOString() : '', 
      start_now: startNow, 
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
          let combinedErrorMsg = "Validation errors:";
          
          Object.entries(response.error.errors).forEach(([field, messages]) => {
            if (Array.isArray(messages) && messages.length > 0) {
              const fieldMapping: Record<string, string> = {
                'start_date': 'startDate', 
                'end_date': 'endDate',  
                'product_id': 'productId',
                'reserve_price': 'reservePrice',
                'bid_increment': 'bidIncrement'
              };
              const formField = fieldMapping[field] || field;
              serverErrors[formField] = messages[0];
              combinedErrorMsg += `\n• ${field.replace(/_/g, ' ')}: ${messages[0]}`;
            }
          });
          
          setFormErrors(prevErrors => ({ ...prevErrors, ...serverErrors }));
          setError(combinedErrorMsg); 
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

  const currentStartDateTime = startNow ? new Date() : getDateWithTime(startDate, startHour, startMinute);
  const minEndDateForCalendar = calculateMinEndDate(currentStartDateTime);
  const maxEndDateForCalendar = calculateMaxEndDate(currentStartDateTime);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Auction</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex items-center whitespace-pre-wrap">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
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
              <div className="space-y-1">
                <Select value={productId} onValueChange={setProductId}>
                  <SelectTrigger id="productId" className={cn(formErrors.productId && "border-red-500")}>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={String(product.id)}>
                        <div className="flex items-center">
                          {getPrimaryImageUrl(product) && (
                            <div className="w-8 h-8 bg-gray-200 rounded mr-2 overflow-hidden flex-shrink-0">
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
                  <p className="text-sm text-red-500 mt-1">{formErrors.productId}</p>
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
                  <div className="space-y-1">
                    <Label htmlFor="reservePrice">
                      Reserve Price <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="reservePrice"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={reservePrice}
                        onChange={(e) => setReservePrice(e.target.value)}
                        className={cn("pl-9", formErrors.reservePrice && "border-red-500")}
                        required
                      />
                    </div>
                    {formErrors.reservePrice && (
                      <p className="text-sm text-red-500">{formErrors.reservePrice}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Minimum price you are willing to accept
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="bidIncrement">
                      Bid Increment <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <ChevronUp className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="bidIncrement"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={bidIncrement}
                        onChange={(e) => setBidIncrement(e.target.value)}
                        className={cn("pl-9", formErrors.bidIncrement && "border-red-500")}
                        required
                      />
                    </div>
                    {formErrors.bidIncrement && (
                      <p className="text-sm text-red-500">{formErrors.bidIncrement}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Minimum amount each new bid must increase by
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="quantity">
                      Quantity <span className="text-red-500">*</span>
                    </Label>
                      <Input
                        id="quantity"
                        type="number"
                        step="1"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className={cn(formErrors.quantity && "border-red-500")}
                      required
                      />
                    {formErrors.quantity && (
                      <p className="text-sm text-red-500">{formErrors.quantity}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Number of items to auction
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="startDate">
                      Start Date & Time <span className="text-red-500">*</span>
                    </Label>
                      <div className="flex items-center space-x-2 mb-2">
                        <Checkbox
                          id="startNow"
                          checked={startNow}
                          onCheckedChange={(checked) => setStartNow(checked as boolean)}
                        />
                      <Label htmlFor="startNow" className="cursor-pointer font-normal">
                        Start auction immediately upon creation
                        </Label>
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
                                (formErrors.startDate || formErrors.startTime) && "border-red-500"
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
                              disabled={(date) => isBefore(date, startOfDay(new Date()))} 
                              />
                            </PopoverContent>
                          </Popover>
                        {formErrors.startDate && (
                           <p className="text-sm text-red-500">{formErrors.startDate}</p>
                        )}
                          
                          <div className="flex items-center space-x-2 mt-2">
                          <div className="flex-1 space-y-1">
                              <Label htmlFor="startHour">Hour (0-23)</Label>
                              <Input
                                id="startHour"
                                type="number"
                                min="0"
                                max="23"
                                value={startHour}
                              onChange={(e) => setStartHour(e.target.value.padStart(2, '0'))}
                              placeholder="HH"
                                className={cn(formErrors.startHour && "border-red-500")}
                              />
                              {formErrors.startHour && (
                                <p className="text-sm text-red-500">{formErrors.startHour}</p>
                              )}
                            </div>
                          <div className="font-bold">:</div>
                          <div className="flex-1 space-y-1">
                              <Label htmlFor="startMinute">Minute (0-59)</Label>
                              <Input
                                id="startMinute"
                                type="number"
                                min="0"
                                max="59"
                                value={startMinute}
                              onChange={(e) => setStartMinute(e.target.value.padStart(2, '0'))}
                              placeholder="MM"
                                className={cn(formErrors.startMinute && "border-red-500")}
                              />
                              {formErrors.startMinute && (
                                <p className="text-sm text-red-500">{formErrors.startMinute}</p>
                              )}
                            </div>
                          </div>
                        </>
                    )}
                    {formErrors.startTime && (
                      <p className="text-sm text-red-500 mt-1">{formErrors.startTime}</p>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="endDate">
                      End Date & Time <span className="text-red-500">*</span>
                    </Label>
                      <div className="flex items-center space-x-2 mb-2">
                        <Checkbox
                        id="endAfterDefault"
                        checked={endAfterDefault}
                          onCheckedChange={(checked) => {
                             setEndAfterDefault(checked as boolean);
                             if (checked && durationSettings) {
                                const startDateTime = startNow ? new Date() : getDateWithTime(startDate, startHour, startMinute);
                                if (startDateTime) {
                                    const defaultEnd = addMinutes(startDateTime, durationSettings.default);
                                    setEndDate(defaultEnd);
                                    setEndHour(defaultEnd.getHours().toString().padStart(2, '0'));
                                    setEndMinute(defaultEnd.getMinutes().toString().padStart(2, '0'));
                              }
                            }
                          }}
                        disabled={!durationSettings || isFetchingSettings}
                        />
                      <Label htmlFor="endAfterDefault" className="cursor-pointer font-normal">
                        End after default duration ({durationSettings ? formatDurationForMessage(durationSettings.default) : 'loading...'}) 
                        </Label>
                      </div>

                    {!endAfterDefault && (
                        <>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button 
                                variant="outline" 
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !endDate && "text-muted-foreground",
                                (formErrors.endDate || formErrors.endTime) && "border-red-500"
                                )}
                              disabled={isFetchingSettings || !currentStartDateTime} 
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
                              fromDate={minEndDateForCalendar} 
                              toDate={maxEndDateForCalendar} 
                              disabled={(date) => 
                                (minEndDateForCalendar && isBefore(date, minEndDateForCalendar)) ||
                                (maxEndDateForCalendar && isBefore(maxEndDateForCalendar, date)) ||
                                false 
                              }
                              />
                            </PopoverContent>
                          </Popover>
                        {formErrors.endDate && (
                           <p className="text-sm text-red-500">{formErrors.endDate}</p>
                        )}
                          
                          <div className="flex items-center space-x-2 mt-2">
                           <div className="flex-1 space-y-1">
                              <Label htmlFor="endHour">Hour (0-23)</Label>
                              <Input
                                id="endHour"
                                type="number"
                                min="0"
                                max="23"
                                value={endHour}
                              onChange={(e) => setEndHour(e.target.value.padStart(2, '0'))}
                              placeholder="HH"
                                className={cn(formErrors.endHour && "border-red-500")}
                              disabled={isFetchingSettings}
                              />
                              {formErrors.endHour && (
                                <p className="text-sm text-red-500">{formErrors.endHour}</p>
                              )}
                            </div>
                           <div className="font-bold">:</div>
                          <div className="flex-1 space-y-1">
                              <Label htmlFor="endMinute">Minute (0-59)</Label>
                              <Input
                                id="endMinute"
                                type="number"
                                min="0"
                                max="59"
                                value={endMinute}
                              onChange={(e) => setEndMinute(e.target.value.padStart(2, '0'))}
                              placeholder="MM"
                                className={cn(formErrors.endMinute && "border-red-500")}
                              disabled={isFetchingSettings}
                              />
                              {formErrors.endMinute && (
                                <p className="text-sm text-red-500">{formErrors.endMinute}</p>
                              )}
                            </div>
                          </div>
                        </>
                    )}
                    {formErrors.endTime && (
                      <p className="text-sm text-red-500 mt-1">{formErrors.endTime}</p>
                    )}
                  </div>
                </div>
                
                <div className="bg-muted p-3 rounded-md mt-4 md:col-span-2">
                  <h4 className="text-sm font-medium mb-1">Auction Rules:</h4>
                  {isFetchingSettings ? (
                     <p className="text-xs text-muted-foreground">Loading duration rules...</p>
                  ) : durationSettings ? (
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                      <li>Min Duration: {formatDurationForMessage(durationSettings.min)}</li>
                      <li>Max Duration: {formatDurationForMessage(durationSettings.max)}</li>
                      <li>Default Duration: {formatDurationForMessage(durationSettings.default)}</li>
                  </ul>
                  ) : (
                     <p className="text-xs text-yellow-600">Could not load duration rules. Using defaults.</p>
                  )}
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
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isVisible"
                    checked={isVisible}
                    onCheckedChange={(checked) => setIsVisible(checked as boolean)}
                  />
                  <Label htmlFor="isVisible" className="cursor-pointer font-normal">
                    Publicly Visible
                  </Label>
                </div>
                <p className="text-xs text-gray-500 pl-6">
                  Uncheck to hide the auction from public listings (e.g., for private sales).
                </p>
              </div>
            </CardContent>
          </Card>
          
          {settingsError && (
            <div className="flex items-center space-x-2 text-sm text-yellow-600 bg-yellow-50 p-3 rounded-md mb-4">
              <AlertCircle className="h-4 w-4" />
              <span>{settingsError} Using fallback durations: Min {durationSettings?.min ? formatDurationForMessage(durationSettings.min) : 'N/A'}, Max {durationSettings?.max ? formatDurationForMessage(durationSettings.max) : 'N/A'}, Default {durationSettings?.default ? formatDurationForMessage(durationSettings.default) : 'N/A'}.</span>
            </div>
          )}
           {formErrors.durationSettings && (
                <p className="text-sm text-red-500 mb-4">{formErrors.durationSettings}</p>
            )}
          
          <div className="flex justify-between items-center mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/dashboard/my-auctions')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isFetchingProducts || isFetchingSettings}>
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
