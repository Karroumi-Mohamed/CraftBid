import React, { useState, useEffect } from 'react';
import api, { makeRequest } from '@/lib/axois'; 
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button'; 
import { AlertCircle, PlusCircle, Loader2, Check, X, Power, PowerOff } from 'lucide-react';
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

interface Category {
    id: number;
    name: string;
}

interface ProductImage {
    id: number;
    path: string;
    is_primary: boolean;
}

interface Product {
    id: number;
    name: string;
    description: string | null;
    status: 'active' | 'inactive';
    category: Category | null;
    images: ProductImage[];
}

const ArtisanProductsPage: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        const fetchProducts = async () => {
            setIsLoading(true);
            setError(null);
            
            try {
                const response = await makeRequest<Product[]>(api.get('/artisan/products'));

                if (response.success && Array.isArray(response.data)) {
                    setProducts(response.data);
                } else {
                    setError(response.error?.message || 'Failed to fetch products or data format is incorrect.');
                    setProducts([]);
                    console.error("Fetch Products Error:", response.error || "Data was not an array");
                    
                    if (response.status === 403) {
                        setError("Unauthorized: You may not have the required permissions or profile setup.");
                    }
                }
            } catch (err) {
                console.error("Error fetching products:", err);
                setError('An unexpected error occurred while fetching products.');
                setProducts([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const [updatingStatusProductId, setUpdatingStatusProductId] = useState<number | null>(null);

    const toggleProductStatus = async (product: Product) => {
        const newStatus = product.status === 'active' ? 'inactive' : 'active';
        setUpdatingStatusProductId(product.id);
        
        try {
            const response = await makeRequest(
                api.patch(`/artisan/products/${product.id}/status`, { status: newStatus })
            );
            
            if (response.success && response.data) {
                setProducts(products.map(p => 
                    p.id === product.id ? {...p, status: response.data.status} : p
                ));
                
                setSuccessMessage(
                    newStatus === 'active'
                        ? `Product "${product.name}" has been activated.`
                        : `Product "${product.name}" has been deactivated.`
                );
                
                setTimeout(() => {
                    setSuccessMessage(null);
                }, 5000);
            } else {
                setError(response.error?.message || `Failed to ${newStatus === 'active' ? 'activate' : 'deactivate'} product. ${newStatus === 'active' ? 'Make sure it has a primary image set.' : ''}`);
            }
        } catch (err) {
            console.error(`Error toggling product status:`, err);
            setError('An unexpected error occurred while updating the product status');
        } finally {
            setUpdatingStatusProductId(null);
        }
    };

    const handleDeleteProduct = async () => {
        if (!productToDelete) return;
        
        setIsDeleting(true);
        
        try {
            const response = await makeRequest(api.delete(`/artisan/products/${productToDelete.id}`));
            
            if (response.success) {
                setProducts(products.filter(product => product.id !== productToDelete.id));
                setSuccessMessage(`Product "${productToDelete.name}" was successfully deleted.`);
                
                setTimeout(() => {
                    setSuccessMessage(null);
                }, 5000);
            } else {
                setError(response.error?.message || 'Failed to delete product');
            }
        } catch (err) {
            console.error("Error deleting product:", err);
            setError('An unexpected error occurred while deleting the product');
        } finally {
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
            setProductToDelete(null);
        }
    };

    const openDeleteDialog = (product: Product) => {
        setProductToDelete(product);
        setIsDeleteDialogOpen(true);
    };

    const getPrimaryImageUrl = (images: ProductImage[]): string | null => {
        const primary = images.find(img => img.is_primary);
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
        return primary ? `${baseUrl}/storage/${primary.path}` : null;
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">My Products</h1>
                <Link to="/dashboard/my-products/create">
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add New Product
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
                <div className="text-red-600 bg-red-100 p-4 rounded mb-4 flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2"/>
                    <span>{error}</span>
                    <button
                        className="absolute top-0 bottom-0 right-0 px-4 py-3"
                        onClick={() => setError(null)}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
            )}

            {isLoading && <p className="text-center py-8">Loading products...</p>}

            {!isLoading && !error && (
                <>
                    {products.length === 0 ? (
                        <p className="text-center py-8">You haven't added any products yet.</p>
                    ) : (
                        <div className="space-y-4">
                            {products.map((product) => {
                                const primaryImageUrl = getPrimaryImageUrl(product.images);
                                return (
                                    <div key={product.id} className="border rounded-md p-4 flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                             <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center overflow-hidden">
                                                 {primaryImageUrl ? (
                                                     <img src={primaryImageUrl} alt={product.name} className="w-full h-full object-cover" />
                                                 ) : (
                                                     <span className="text-xs text-gray-500 px-1 text-center">No Primary Image</span>
                                                 )}
                                             </div>
                                             <div>
                                                 <h3 className="font-semibold">{product.name}</h3>
                                                 <p className="text-sm text-gray-600">{product.category?.name || 'Uncategorized'}</p>
                                                 <span className={`text-xs px-2 py-0.5 rounded-full ${product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                     {product.status}
                                                 </span>
                                             </div>
                                        </div>
                                        <div className="flex items-center">
                                            <Button 
                                                variant={product.status === 'active' ? "outline" : "default"}
                                                size="sm" 
                                                className="mr-2"
                                                onClick={() => toggleProductStatus(product)}
                                                disabled={updatingStatusProductId === product.id}
                                            >
                                                {updatingStatusProductId === product.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : product.status === 'active' ? (
                                                    <>
                                                        <PowerOff className="h-4 w-4 mr-1" /> Deactivate
                                                    </>
                                                ) : (
                                                    <>
                                                        <Power className="h-4 w-4 mr-1" /> Activate
                                                    </>
                                                )}
                                            </Button>
                                            
                                            <Link to={`/dashboard/my-products/edit/${product.id}`}>
                                                <Button variant="outline" size="sm" className="mr-2">Edit</Button>
                                            </Link>

                                            <Button 
                                                variant="destructive" 
                                                size="sm" 
                                                onClick={() => openDeleteDialog(product)}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to delete this product?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {productToDelete && (
                                <>
                                    This will permanently delete "{productToDelete.name}" and all associated images. 
                                    This action cannot be undone.
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteProduct}
                            disabled={isDeleting}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete Product"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default ArtisanProductsPage;
