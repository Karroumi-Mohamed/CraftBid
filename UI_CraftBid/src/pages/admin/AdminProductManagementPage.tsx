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
import { Loader2, Search, Star, AlertCircle, Check, AlertTriangle, Eye, Trash, Edit, X, Ban, Play, Pause, StarOff } from 'lucide-react';

interface Category {
  id: number;
  name: string;
}

interface User {
  id: number;
  name: string;
  email: string;
}

interface Artisan {
  id: number;
  user_id: number;
  shop_name: string;
  user: User;
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
  slug: string;
  description: string;
  category_id: number;
  artisan_id: number;
  status: 'active' | 'inactive' | 'suspended';
  featured: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
  artisan?: Artisan;
  images: ProductImage[];
}

interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface ProductResponse {
  data: Product[];
  links: any;
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    path: string;
    per_page: number;
    to: number;
    total: number;
  }
}

const AdminProductManagementPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [actionInProgress, setActionInProgress] = useState<boolean>(false);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchProducts = async (page = 1) => {
    setIsLoading(true);
    setError(null);

    const params: Record<string, string | number> = { 
      page,
      per_page: pagination.per_page
    };

    if (searchTerm) params.search = searchTerm;
    if (selectedCategory && selectedCategory !== 'all') params.category_id = selectedCategory;
    if (activeTab !== 'all') params.status = activeTab;

    try {
      const response = await makeRequest<ProductResponse>(
        api.get('/admin/products', { params })
      );

      if (response.success && response.data) {
        if (Array.isArray(response.data)) {
          setProducts(response.data);
          setPagination({
            current_page: 1,
            last_page: 1,
            per_page: response.data.length,
            total: response.data.length,
          });
        } else if (response.data.data) {
          setProducts(response.data.data);
          
          if (response.data.meta) {
            setPagination({
              current_page: response.data.meta.current_page || 1,
              last_page: response.data.meta.last_page || 1,
              per_page: response.data.meta.per_page || 10,
              total: response.data.meta.total || response.data.data.length,
            });
          } else {
            setPagination({
              current_page: 1,
              last_page: 1,
              per_page: 10,
              total: response.data.data.length,
            });
          }
        } else {
          setError('Received unexpected data format from server');
          console.error("Unexpected data format:", response.data);
          setProducts([]);
        }
      } else {
        setError(response.error?.message || 'Failed to load products');
        console.error("Product fetch error:", response.error);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

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

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts(1); 
  }, [activeTab, searchTerm, selectedCategory]);

  const handlePageChange = (page: number) => {
    fetchProducts(page);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(1);
  };

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-500">Inactive</Badge>;
      case 'suspended':
        return <Badge className="bg-red-500">Suspended</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPrimaryImageUrl = (images: ProductImage[]) => {
    const primary = images?.find(img => img.is_primary);
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
    return primary ? `${baseUrl}/storage/${primary.path}` : null;
  };

  const handleSuspendProduct = async (product: Product) => {
    setActionInProgress(true);
    try {
      const response = await makeRequest(
        api.patch(`/admin/products/${product.id}/suspend`)
      );
      
      if (response.success) {
        setSuccessMessage(`Product "${product.name}" has been suspended`);
        fetchProducts(pagination.current_page); 
      } else {
        setError(response.error?.message || 'Failed to suspend product');
      }
    } catch (err) {
      console.error("Error suspending product:", err);
      setError('An unexpected error occurred');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleActivateProduct = async (product: Product) => {
    setActionInProgress(true);
    try {
      const response = await makeRequest(
        api.patch(`/admin/products/${product.id}/activate`)
      );
      
      if (response.success) {
        setSuccessMessage(`Product "${product.name}" has been activated`);
        fetchProducts(pagination.current_page); 
      } else {
        setError(response.error?.message || 'Failed to activate product');
      }
    } catch (err) {
      console.error("Error activating product:", err);
      setError('An unexpected error occurred');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleDeactivateProduct = async (product: Product) => {
    setActionInProgress(true);
    try {
      const response = await makeRequest(
        api.patch(`/admin/products/${product.id}/deactivate`)
      );
      
      if (response.success) {
        setSuccessMessage(`Product "${product.name}" has been deactivated`);
        fetchProducts(pagination.current_page); 
      } else {
        setError(response.error?.message || 'Failed to deactivate product');
      }
    } catch (err) {
      console.error("Error deactivating product:", err);
      setError('An unexpected error occurred');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleToggleFeatured = async (product: Product) => {
    setActionInProgress(true);
    try {
      const response = await makeRequest(
        api.patch(`/admin/products/${product.id}/toggle-featured`)
      );
      
      if (response.success) {
        setSuccessMessage(
          product.featured 
            ? `Product "${product.name}" is no longer featured` 
            : `Product "${product.name}" is now featured`
        );
        fetchProducts(pagination.current_page); 
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

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    
    setActionInProgress(true);
    try {
      const response = await makeRequest(
        api.delete(`/admin/products/${selectedProduct.id}`)
      );
      
      if (response.success) {
        setSuccessMessage(`Product "${selectedProduct.name}" has been deleted`);
        setIsDeleteDialogOpen(false);
        fetchProducts(pagination.current_page); 
      } else {
        setError(response.error?.message || 'Failed to delete product');
      }
    } catch (err) {
      console.error("Error deleting product:", err);
      setError('An unexpected error occurred');
    } finally {
      setActionInProgress(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Product Management</h1>
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

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label htmlFor="search" className="text-sm font-medium">
                Search Products
              </label>
              <form onSubmit={handleSearch} className="flex">
                <Input
                  id="search"
                  placeholder="Search by name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button type="submit" className="ml-2">
                  <Search className="h-4 w-4" />
                </Button>
              </form>
            </div>
            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium">
                Category
              </label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="mb-6"
      >
        <TabsList>
          <TabsTrigger value="all">All Products</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
          <TabsTrigger value="suspended">Suspended</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>
            {isLoading ? 'Loading products...' : `Showing ${products.length} of ${pagination.total} products`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No products found. Try adjusting your filters.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Artisan</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const primaryImageUrl = getPrimaryImageUrl(product.images);
                  
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden">
                          {primaryImageUrl ? (
                            <img 
                              src={primaryImageUrl} 
                              alt={product.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                              <span className="text-xs">No image</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.artisan?.shop_name || product.artisan?.user?.name || 'Unknown'}</TableCell>
                      <TableCell>{product.category?.name || 'Uncategorized'}</TableCell>
                      <TableCell>{getStatusBadge(product.status)}</TableCell>
                      <TableCell>
                        {product.featured ? (
                          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                        ) : (
                          <Star className="h-5 w-5 text-gray-300" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            title="View Details"
                            onClick={() => {
                              setSelectedProduct(product);
                              setIsViewDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {product.status !== 'suspended' && (
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Suspend Product"
                              onClick={() => handleSuspendProduct(product)}
                              disabled={actionInProgress}
                            >
                              <Ban className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                          
                          {product.status !== 'active' && (
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Activate Product"
                              onClick={() => handleActivateProduct(product)}
                              disabled={actionInProgress}
                            >
                              <Play className="h-4 w-4 text-green-500" />
                            </Button>
                          )}
                          
                          {product.status !== 'inactive' && product.status !== 'suspended' && (
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Deactivate Product"
                              onClick={() => handleDeactivateProduct(product)}
                              disabled={actionInProgress}
                            >
                              <Pause className="h-4 w-4 text-orange-500" />
                            </Button>
                          )}
                          
                          <Button
                            size="icon"
                            variant="ghost"
                            title={product.featured ? "Remove from Featured" : "Add to Featured"}
                            onClick={() => handleToggleFeatured(product)}
                            disabled={actionInProgress}
                          >
                            {product.featured ? (
                              <StarOff className="h-4 w-4 text-yellow-500" />
                            ) : (
                              <Star className="h-4 w-4" />
                            )}
                          </Button>
                          
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Delete Product"
                            onClick={() => {
                              setSelectedProduct(product);
                              setIsDeleteDialogOpen(true);
                            }}
                            disabled={actionInProgress}
                          >
                            <Trash className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          
          {pagination.last_page > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-4">
              <Button 
                variant="outline" 
                onClick={() => handlePageChange(1)}
                disabled={pagination.current_page === 1}
              >
                First
              </Button>
              <Button 
                variant="outline"
                onClick={() => handlePageChange(pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
              >
                Previous
              </Button>
              
              <span className="mx-2">
                Page {pagination.current_page} of {pagination.last_page}
              </span>
              
              <Button 
                variant="outline"
                onClick={() => handlePageChange(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.last_page}
              >
                Next
              </Button>
              <Button 
                variant="outline"
                onClick={() => handlePageChange(pagination.last_page)}
                disabled={pagination.current_page === pagination.last_page}
              >
                Last
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle>Product Details</DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Product Images</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedProduct.images && selectedProduct.images.length > 0 ? (
                      selectedProduct.images.map((image) => {
                        const imageUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'}/storage/${image.path}`;
                        return (
                          <div 
                            key={image.id} 
                            className={`
                              relative rounded overflow-hidden border
                              ${image.is_primary ? 'ring-2 ring-green-500' : ''}
                            `}
                          >
                            <img 
                              src={imageUrl}
                              alt={`${selectedProduct.name} image ${image.id}`}
                              className="w-full h-36 object-cover"
                            />
                            {image.is_primary && (
                              <div className="absolute top-1 left-1 bg-green-500 rounded-full p-0.5">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-2 text-gray-400 text-center py-8 border rounded">
                        No images available
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Product Name</h3>
                      <p>{selectedProduct.name}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Description</h3>
                      <p className="text-sm">{selectedProduct.description || 'No description provided.'}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Category</h3>
                      <p>{selectedProduct.category?.name || 'Uncategorized'}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Artisan</h3>
                      <p>{selectedProduct.artisan?.shop_name || selectedProduct.artisan?.user?.name || 'Unknown'}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Status</h3>
                      <div className="mt-1">{getStatusBadge(selectedProduct.status)}</div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Featured</h3>
                      <p>{selectedProduct.featured ? 'Yes' : 'No'}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Created At</h3>
                      <p>{new Date(selectedProduct.created_at).toLocaleString()}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                      <p>{new Date(selectedProduct.updated_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                    Close
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the product "{selectedProduct?.name}" and all its images.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionInProgress}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              disabled={actionInProgress}
              className="bg-red-500 hover:bg-red-600"
            >
              {actionInProgress ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminProductManagementPage;
