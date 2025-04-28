import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { makeRequest, ApiResponse } from '@/lib/axois';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Check, Loader2 } from 'lucide-react';

interface Category {
    id: number;
    name: string;
}

interface ProductImage {
    id: number;
    path: string; 
    is_primary: boolean;
    product_id: number;
}

interface Product {
    id: number;
    name: string;
    description: string;
    category_id: number;
    status: 'active' | 'inactive';
    images: ProductImage[];
}

const AddProductPage: React.FC = () => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState<string>('');
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<'details' | 'images'>('details');
    const [newProductId, setNewProductId] = useState<number | null>(null);
    
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const [imageUploadError, setImageUploadError] = useState<string | null>(null);
    const [isUploadingImages, setIsUploadingImages] = useState<boolean>(false);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    
    const [uploadedImages, setUploadedImages] = useState<ProductImage[]>([]);
    const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
    const [isSettingPrimary, setIsSettingPrimary] = useState<boolean>(false);
    const [primarySetSuccess, setPrimarySetSuccess] = useState<boolean>(false);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchCategories = async () => {
            setIsLoading(true);
            const response = await makeRequest<Category[]>(api.get('/categories?flat=true')); 
            if (response.success && response.data) {
                setCategories(response.data); 
            } else {
                setError('Failed to load categories. Please try again.');
                console.error("Category fetch error:", response.error);
                setCategories([]); 
            }
            setIsLoading(false);
        };
        fetchCategories();
    }, []);

    const handleDetailsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        if (!categoryId) {
            setError('Please select a category.');
            setIsLoading(false);
            return;
        }

        const productData = {
            name,
            description,
            category_id: parseInt(categoryId, 10), 
        };


        const response = await makeRequest<Product>(api.post('/artisan/products', productData));

        if (response.success && response.data) {
            setNewProductId(response.data.id); 
            setStep('images'); 
        } else {
            let errorMessage = response.error?.message || 'Failed to create product. Please check your input.';
            if (response.error?.errors) {
                 console.error("Validation Errors:", response.error.errors);
                 const firstErrorField = Object.keys(response.error.errors)[0];
                 const firstErrorMessage = response.error.errors[firstErrorField][0];
                 errorMessage = `Validation failed: ${firstErrorMessage}`; 
            } else {
                console.error("Product Creation Error:", response.error);
            }
            setError(errorMessage);
        }
        setIsLoading(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setImageUploadError(null); 
        const files = e.target.files;
        if (files) {
            setSelectedFiles(files);
            const previewUrls = Array.from(files).map(file => URL.createObjectURL(file));
            setImagePreviews(previewUrls);
        } else {
            setSelectedFiles(null);
            setImagePreviews([]);
        }
    };

    const handleImageUpload = async () => {
        if (!selectedFiles || selectedFiles.length === 0) {
            setImageUploadError('Please select at least one image file.');
            return;
        }
        if (!newProductId) {
            setImageUploadError('Product ID is missing. Cannot upload images.');
            return;
        }

        setImageUploadError(null);
        setIsUploadingImages(true);

        const formData = new FormData();
        Array.from(selectedFiles).forEach((file) => {
            formData.append('images[]', file); 
        });

        const response = await makeRequest(
            api.post(`/artisan/products/${newProductId}/images`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })
        );

        setIsUploadingImages(false);

        if (response.success) {
            setSelectedFiles(null);
            setImagePreviews([]);
            
            if (response.data?.product?.images) {
                setUploadedImages(response.data.product.images);
                if (response.data.product.images.length > 0) {
                    setSelectedImageId(response.data.product.images[0].id);
                }
            }
        } else {
            let errorMessage = response.error?.message || 'Failed to upload images.';
            if (response.error?.errors) {
                 console.error("Image Upload Validation Errors:", response.error.errors);
                 const firstErrorField = Object.keys(response.error.errors)[0];
                 const errorKey = firstErrorField.startsWith('images.') ? firstErrorField : 'images';
                 const firstErrorMessage = response.error.errors[errorKey]?.[0] || 'Invalid image provided.';
                 errorMessage = `Validation failed: ${firstErrorMessage}`;
            } else {
                 console.error("Image Upload Error:", response.error);
            }
            setImageUploadError(errorMessage);
        }
    };

    const handleSetPrimaryImage = async () => {
        if (!selectedImageId || !newProductId) {
            setImageUploadError('Please select an image to set as primary.');
            return;
        }

        setIsSettingPrimary(true);
        setPrimarySetSuccess(false);

        const response = await makeRequest(
            api.post(`/artisan/products/${newProductId}/images/${selectedImageId}/set-primary`)
        );

        setIsSettingPrimary(false);

        if (response.success) {
            setPrimarySetSuccess(true);
            if (response.data?.product?.images) {
                setUploadedImages(response.data.product.images);
            }
            setTimeout(() => {
                navigate('/dashboard/my-products');
            }, 1500);
        } else {
            setImageUploadError(response.error?.message || 'Failed to set primary image.');
        }
    };

    useEffect(() => {
        return () => {
            imagePreviews.forEach(url => URL.revokeObjectURL(url));
        };
    }, [imagePreviews]);

    const getImageUrl = (path: string): string => {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
        return `${baseUrl}/storage/${path}`;
    };

    const renderDetailsForm = () => {
        return (
            <form onSubmit={handleDetailsSubmit} className="space-y-4">
                 <h2 className="text-xl font-semibold mb-4">Step 1: Add Product Details</h2>
                <div>
                    <Label htmlFor="name">Product Name</Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                </div>
                <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                </div>
                <div>
                    <Label htmlFor="category">Category</Label>
                     <Select
                        value={categoryId}
                        onValueChange={setCategoryId}
                        required
                        disabled={isLoading || categories.length === 0}
                    >
                        <SelectTrigger id="category">
                            <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map((category) => (
                                <SelectItem key={category.id} value={String(category.id)}>
                                    {category.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {categories.length === 0 && !isLoading && <p className="text-sm text-gray-500 mt-1">Loading categories or none available.</p>}
                </div>

                {error && (
                    <div className="text-red-600 bg-red-100 p-3 rounded flex items-center text-sm">
                        <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0"/>
                        <span>{error}</span>
                    </div>
                )}

                <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save and Add Images'}
                </Button>
            </form>
        );
    };

    const renderImageUploadStep = () => {
        return (
            <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Step 2: Upload Product Images</h2>
                <p className="text-sm text-gray-600 mb-4">Product details saved successfully. Now, upload images for your product.</p>

                <div className="border rounded-md p-4 bg-gray-50">
                    <div className="mb-4">
                        <Label htmlFor="productImages">Select Images (Multiple Allowed)</Label>
                        <Input
                            id="productImages"
                            type="file"
                            multiple
                            accept="image/jpeg,image/png,image/gif,image/svg+xml"
                            onChange={handleFileChange}
                            disabled={isUploadingImages}
                            className="mt-1"
                        />
                    </div>

                    {imagePreviews.length > 0 && (
                        <div className="mb-4">
                            <p className="text-sm text-gray-700 mb-2">Selected images:</p>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                {imagePreviews.map((previewUrl, index) => (
                                    <img
                                        key={index}
                                        src={previewUrl}
                                        alt={`Preview ${index + 1}`}
                                        className="w-full h-24 object-cover rounded border"
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    <Button
                        onClick={handleImageUpload}
                        disabled={isUploadingImages || !selectedFiles || selectedFiles.length === 0}
                        className="w-full"
                    >
                        {isUploadingImages ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</>
                        ) : (
                            'Upload Selected Images'
                        )}
                    </Button>
                </div>

                {uploadedImages.length > 0 && (
                    <div className="border rounded-md p-4">
                        <h3 className="font-medium mb-3">Select Primary Image</h3>
                        <p className="text-sm text-gray-600 mb-3">
                            Click on an image to select it as the primary image for your product.
                        </p>
                        
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-4">
                            {uploadedImages.map((image) => (
                                <div 
                                    key={image.id} 
                                    className={`
                                        relative cursor-pointer rounded border overflow-hidden
                                        ${selectedImageId === image.id ? 'ring-2 ring-blue-500' : ''}
                                        ${image.is_primary ? 'ring-2 ring-green-500' : ''}
                                    `}
                                    onClick={() => setSelectedImageId(image.id)}
                                >
                                    <img
                                        src={getImageUrl(image.path)}
                                        alt={`Product image ${image.id}`}
                                        className="w-full h-24 object-cover"
                                    />
                                    {image.is_primary && (
                                        <div className="absolute top-1 right-1 bg-green-500 rounded-full p-0.5">
                                            <Check className="h-3 w-3 text-white" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                onClick={handleSetPrimaryImage}
                                disabled={isSettingPrimary || selectedImageId === null}
                                className="flex-1"
                            >
                                {isSettingPrimary ? (
                                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Setting...</>
                                ) : primarySetSuccess ? (
                                    <><Check className="h-4 w-4 mr-2" /> Set as Primary & Save</>
                                ) : (
                                    'Set as Primary & Save'
                                )}
                            </Button>
                            
                            <Button
                                variant="outline"
                                onClick={() => navigate('/dashboard/my-products')}
                                disabled={isSettingPrimary}
                                className="flex-1"
                            >
                                Cancel & Go Back
                            </Button>
                        </div>
                    </div>
                )}

                {imageUploadError && (
                    <div className="text-red-600 bg-red-100 p-3 rounded flex items-center text-sm">
                        <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0"/>
                        <span>{imageUploadError}</span>
                    </div>
                )}
                
                {primarySetSuccess && (
                    <div className="text-green-600 bg-green-100 p-3 rounded flex items-center text-sm">
                        <Check className="h-4 w-4 mr-2 flex-shrink-0"/>
                        <span>Primary image set successfully! Redirecting to product list...</span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-2xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Add New Product</h1>
            {step === 'details' ? renderDetailsForm() : renderImageUploadStep()}
        </div>
    );
};

export default AddProductPage;
