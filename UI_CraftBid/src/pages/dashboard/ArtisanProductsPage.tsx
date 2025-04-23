import React, { useState, useEffect } from 'react';
import api, { makeRequest, ApiResponse } from '@/lib/axois'; // Use @ alias
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button'; // Assuming shadcn Button
import { AlertCircle, PlusCircle } from 'lucide-react';

// Define interfaces based on expected API response structure
// Adjust these based on your actual Product and related models/API resource
interface Category {
    id: number;
    name: string;
}

interface ProductImage {
    id: number;
    path: string; // Assuming path stores the URL or relative path
    is_primary: boolean;
}

interface Product {
    id: number;
    name: string;
    description: string | null;
    quantity: number;
    status: 'active' | 'inactive';
    featured: boolean;
    category: Category | null; // Assuming category relationship is loaded
    primary_image: ProductImage | null; // Assuming primaryImage relationship is loaded
    // Add other relevant fields: slug, created_at, etc.
}

// Define the structure of the paginated response from Laravel
interface PaginatedProductsResponse {
    current_page: number;
    data: Product[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: { url: string | null; label: string; active: boolean }[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
}

const ArtisanProductsPage: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    // Add state for pagination if needed later

    useEffect(() => {
        const fetchProducts = async () => {
            setIsLoading(true);
            setError(null);
            const response = await makeRequest<PaginatedProductsResponse>(api.get('/artisan/products')); // Use the new API route

            if (response.success && response.data) {
                setProducts(response.data.data); // Set products from the 'data' array
            } else {
                setError(response.error?.message || 'Failed to fetch products.');
                // Handle specific errors like 403 Forbidden if needed
                if (response.status === 403) {
                     setError("Unauthorized: You may not have the required permissions or profile setup.");
                }
            }
            setIsLoading(false);
        };

        fetchProducts();
    }, []); // Empty dependency array means this runs once on mount

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">My Products</h1>
                <Link to="/dashboard/my-products/create"> {/* Link to create product page (to be created) */}
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add New Product
                    </Button>
                </Link>
            </div>

            {isLoading && <p>Loading products...</p>}

            {error && (
                 <div className="text-red-600 bg-red-100 p-4 rounded mb-4 flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2"/>
                    <span>{error}</span>
                 </div>
            )}

            {!isLoading && !error && (
                <>
                    {products.length === 0 ? (
                        <p>You haven't added any products yet.</p>
                    ) : (
                        <div className="space-y-4">
                            {/* Simple list display - Replace with a table or card grid later */}
                            {products.map((product) => (
                                <div key={product.id} className="border rounded-md p-4 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                         {/* Basic Image Placeholder */}
                                         <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                                             {product.primary_image ? (
                                                 <img src={product.primary_image.path} alt={product.name} className="w-full h-full object-cover rounded" />
                                             ) : (
                                                 <span className="text-xs text-gray-500">No Image</span>
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
                                    <div>
                                        {/* Add Edit/Delete/View buttons here */}
                                        <Button variant="outline" size="sm" className="mr-2">Edit</Button>
                                        <Button variant="destructive" size="sm">Delete</Button>
                                    </div>
                                </div>
                            ))}
                            {/* TODO: Add Pagination controls if using pagination */}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ArtisanProductsPage;
