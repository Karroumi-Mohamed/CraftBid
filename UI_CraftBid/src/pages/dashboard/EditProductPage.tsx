import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { makeRequest } from '@/lib/axois';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Check, Loader2, Trash2 } from 'lucide-react';

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
    category?: Category;
}

const EditProductPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState<string>('');
    const [status, setStatus] = useState<'active' | 'inactive'>('inactive');
    
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    
    const [images, setImages] = useState<ProductImage[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const [imageUploadError, setImageUploadError] = useState<string | null>(null);
    const [isUploadingImages, setIsUploadingImages] = useState<boolean>(false);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
    const [isSettingPrimary, setIsSettingPrimary] = useState<boolean>(false);
    const [isDeletingImage, setIsDeletingImage] = useState<boolean>(false);

    useEffect(() => {
        const fetchProductData = async () => {
            if (!id) return;
            setIsLoading(true);
            setError(null);
            
            try {
                const response = await makeRequest<Product>(api.get(`/artisan/products/${id}`));
                
                if (response.success && response.data) {
                    const product = response.data;
                    console.log('Product data from API:', product);
                    
                    setName(product.name);
                    setDescription(product.description);
                    setCategoryId(String(product.category_id));
                    setStatus(product.status);
                    setImages(product.images || []);
                } else {
                    setError(response.error?.message || 'Failed to load product details.');
                    console.error("Product Fetch Error:", response.error);
                }
                
                setIsLoading(false);
            } catch (err) {
                console.error("Error fetching product:", err);
                setError('An unexpected error occurred while loading the product.');
                setIsLoading(false);
            }
        };

        fetchProductData();
    }, [id]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await makeRequest<Category[]>(api.get('/categories?flat=true'));
                if (response.success && response.data) {
                    setCategories(response.data);
                } else {
                    console.error("Category fetch error:", response.error);
                }
            } catch (err) {
                console.error("Error fetching categories:", err);
            }
        };
        
        fetchCategories();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!id) {
            setError('Product ID is missing.');
            return;
        }
        
        setError(null);
        setSuccess(null);
        setIsSaving(true);
        
        const productData = {
            name,
            description,
            category_id: parseInt(categoryId, 10),
        };
        
        try {
            const response = await makeRequest<Product>(
                api.put(`/artisan/products/${id}`, productData)
            );
            
            if (response.success) {
                setSuccess('Product updated successfully!');
                if (response.data) {
                    setName(response.data.name);
                    setDescription(response.data.description);
                    setCategoryId(String(response.data.category_id));
                    setStatus(response.data.status);
                }
            } else {
                let errorMessage = response.error?.message || 'Failed to update product.';
                if (response.error?.errors) {
                    const firstErrorField = Object.keys(response.error.errors)[0];
                    const firstErrorMessage = response.error.errors[firstErrorField][0];
                    errorMessage = `Validation failed: ${firstErrorMessage}`;
                }
                setError(errorMessage);
            }
        } catch (err) {
            console.error("Error updating product:", err);
            setError('An unexpected error occurred while saving the product.');
        } finally {
            setIsSaving(false);
        }
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
        
        if (!id) {
            setImageUploadError('Product ID is missing.');
            return;
        }
        
        setImageUploadError(null);
        setIsUploadingImages(true);
        
        const formData = new FormData();
        Array.from(selectedFiles).forEach(file => {
            formData.append('images[]', file);
        });
        
        try {
            const response = await makeRequest(
                api.post(`/artisan/products/${id}/images`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                })
            );
            
            if (response.success && response.data?.product?.images) {
                setSelectedFiles(null);
                setImagePreviews([]);
                
                setImages(response.data.product.images);
                setSuccess('Images uploaded successfully!');
                
                setTimeout(() => setSuccess(null), 3000);
            } else {
                let errorMessage = response.error?.message || 'Failed to upload images.';
                if (response.error?.errors) {
                    const firstErrorField = Object.keys(response.error.errors)[0];
                    const errorKey = firstErrorField.startsWith('images.') ? firstErrorField : 'images';
                    const firstErrorMessage = response.error.errors[errorKey]?.[0] || 'Invalid image provided.';
                    errorMessage = `Validation failed: ${firstErrorMessage}`;
                }
                setImageUploadError(errorMessage);
            }
        } catch (err) {
            console.error("Error uploading images:", err);
            setImageUploadError('An unexpected error occurred during upload.');
        } finally {
            setIsUploadingImages(false);
        }
    };

    const handleSetPrimaryImage = async () => {
        if (!selectedImageId || !id) {
            setImageUploadError('Please select an image to set as primary.');
            return;
        }
        
        setIsSettingPrimary(true);
        setImageUploadError(null);
        
        try {
            const response = await makeRequest(
                api.post(`/artisan/products/${id}/images/${selectedImageId}/set-primary`)
            );
            
            if (response.success) {
                if (response.data?.product?.images) {
                    setImages(response.data.product.images);
                    if (response.data.product.status) {
                        setStatus(response.data.product.status);
                    }
                }
                setSuccess('Primary image updated successfully!');
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setImageUploadError(response.error?.message || 'Failed to set primary image.');
            }
        } catch (err) {
            console.error("Error setting primary image:", err);
            setImageUploadError('An unexpected error occurred.');
        } finally {
            setIsSettingPrimary(false);
        }
    };

    const handleDeleteImage = async (imageId: number) => {
        if (!id) return;
        
        setIsDeletingImage(true);
        setImageUploadError(null);
        
        try {
            const response = await makeRequest(
                api.delete(`/artisan/products/${id}/images/${imageId}`)
            );
            
            if (response.success) {
                setImages(prevImages => prevImages.filter(img => img.id !== imageId));
                setSuccess('Image deleted successfully!');
                setTimeout(() => setSuccess(null), 3000);
                
                if (selectedImageId === imageId) {
                    setSelectedImageId(null);
                }
            } else {
                setImageUploadError(response.error?.message || 'Failed to delete image.');
            }
        } catch (err) {
            console.error("Error deleting image:", err);
            setImageUploadError('An unexpected error occurred while deleting the image.');
        } finally {
            setIsDeletingImage(false);
        }
    };

    const getImageUrl = (path: string): string => {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
        return `${baseUrl}/storage/${path}`;
    };

    useEffect(() => {
        return () => {
            imagePreviews.forEach(url => URL.revokeObjectURL(url));
        };
    }, [imagePreviews]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Edit Product</h1>
            
            {success && (
                <div className="text-green-600 bg-green-100 p-3 rounded flex items-center text-sm mb-4">
                    <Check className="h-4 w-4 mr-2 flex-shrink-0"/>
                    <span>{success}</span>
                </div>
            )}
            
            {error && (
                <div className="text-red-600 bg-red-100 p-3 rounded flex items-center text-sm mb-4">
                    <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0"/>
                    <span>{error}</span>
                </div>
            )}
            
            <div className="border rounded-md p-4 mb-6 bg-white">
                <h2 className="font-semibold mb-4">Product Details</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="name">Product Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            disabled={isSaving}
                        />
                    </div>
                    
                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            disabled={isSaving}
                        />
                    </div>
                    
                    <div>
                        <Label htmlFor="category">Category</Label>
                        <Select
                            value={categoryId}
                            onValueChange={setCategoryId}
                            required
                            disabled={isSaving || categories.length === 0}
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
                    </div>
                    
                    <div>
                        <Label htmlFor="status">Status</Label>
                        <div className="mt-1">
                            <span className={`inline-flex px-3 py-1 rounded-full text-sm ${
                                status === 'active' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                            }`}>
                                {status === 'active' 
                                    ? 'Active (has primary image)' 
                                    : 'Inactive (needs primary image)'}
                            </span>
                        </div>
                    </div>
                    
                    <Button 
                        type="submit" 
                        disabled={isSaving}
                        className="w-full"
                    >
                        {isSaving ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                        ) : (
                            'Save Changes'
                        )}
                    </Button>
                </form>
            </div>
            
            <div className="border rounded-md p-4 mb-6 bg-white">
                <h2 className="font-semibold mb-4">Product Images</h2>
                
                {images.length > 0 ? (
                    <div className="mb-6">
                        <h3 className="text-sm font-medium mb-2">Current Images</h3>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
                            {images.map((image) => (
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
                                        <div className="absolute top-1 left-1 bg-green-500 rounded-full p-0.5">
                                            <Check className="h-3 w-3 text-white" />
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        className="absolute top-1 right-1 bg-red-500 rounded-full p-0.5 opacity-70 hover:opacity-100"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteImage(image.id);
                                        }}
                                        disabled={isDeletingImage || image.is_primary}
                                        title={image.is_primary ? "Cannot delete primary image" : "Delete image"}
                                    >
                                        <Trash2 className="h-3 w-3 text-white" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        
                        {selectedImageId && (
                            <Button
                                onClick={handleSetPrimaryImage}
                                disabled={isSettingPrimary || images.find(img => img.id === selectedImageId)?.is_primary}
                                className="mb-4"
                                variant={images.find(img => img.id === selectedImageId)?.is_primary ? "outline" : "default"}
                            >
                                {isSettingPrimary ? (
                                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Setting...</>
                                ) : images.find(img => img.id === selectedImageId)?.is_primary ? (
                                    'Current Primary Image'
                                ) : (
                                    'Set as Primary Image'
                                )}
                            </Button>
                        )}
                    </div>
                ) : (
                    <p className="text-gray-500 text-sm mb-4">No images uploaded yet. Your product will remain inactive until you add at least one image and set it as primary.</p>
                )}
                
                <div className="bg-gray-50 p-3 rounded-md">
                    <h3 className="text-sm font-medium mb-2">Upload New Images</h3>
                    <div className="mb-4">
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
                    
                    {imageUploadError && (
                        <div className="text-red-600 bg-red-100 p-3 rounded flex items-center text-sm mb-4">
                            <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0"/>
                            <span>{imageUploadError}</span>
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
                            'Upload New Images'
                        )}
                    </Button>
                </div>
            </div>
            
            <div className="flex justify-between">
                <Button
                    variant="outline"
                    onClick={() => navigate('/dashboard/my-products')}
                >
                    Back to Products
                </Button>
            </div>
        </div>
    );
};

export default EditProductPage;
