import React, { useState, useEffect, useMemo } from 'react';
import api, { makeRequest, ApiResponse } from '@/lib/axois';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AlertCircle, PlusCircle } from "lucide-react";
import CategoryTreeNode from '@/components/admin/CategoryTreeNode';

export interface Category {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    parent_id: number | null;
    parent?: Category | null;
    children?: Category[];
}

interface CategoryFormProps {
    initialData?: Category | null;
    allCategories: Category[];
    onSubmit: (data: Partial<Category>) => Promise<void>;
    onCancel: () => void;
    isLoading: boolean;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ initialData, allCategories, onSubmit, onCancel, isLoading }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [parentId, setParentId] = useState<string>(initialData?.parent_id?.toString() || 'none');
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormErrors({});
        const parentIdToSend = parentId === 'none' ? null : parseInt(parentId, 10);
        const dataToSubmit: Partial<Category> = { name, description: description || null, parent_id: parentIdToSend };
        if (!name.trim()) {
            setFormErrors({ name: 'Name is required.' }); return;
        }
        await onSubmit(dataToSubmit);
    };

    const availableParents = useMemo(() => {
        if (!initialData) return allCategories;
        return allCategories.filter(cat => cat.id !== initialData.id);
    }, [allCategories, initialData]);

    const buildCategoryOptions = (categories: Category[], level = 0): { value: string; label: string }[] => {
        let options: { value: string; label: string }[] = [];
        categories.forEach(cat => {
            if (initialData && cat.id === initialData.id) return;
            options.push({ value: cat.id.toString(), label: `${'--'.repeat(level)} ${cat.name}` });
            if (cat.children && cat.children.length > 0) {
                options = options.concat(buildCategoryOptions(cat.children, level + 1));
            }
        });
        return options;
    };

    const [flatCategoryList, setFlatCategoryList] = useState<Category[]>([]);
    useEffect(() => {
        const fetchFlatList = async () => {
            const response = await makeRequest<Category[]>(api.get('/categories?flat=true'));
            if (response.success && response.data) {
                setFlatCategoryList(response.data);
            } else {
                console.error("Failed to fetch flat category list for dropdown");
            }
        };
        fetchFlatList();
    }, []);

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="category-name">Name</Label>
                <Input id="category-name" value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} required className={formErrors.name ? 'border-destructive' : ''} />
                {formErrors.name && <p className="text-sm text-destructive mt-1">{formErrors.name}</p>}
            </div>
            <div>
                <Label htmlFor="category-parent">Parent Category (Optional)</Label>
                <Select value={parentId} onValueChange={setParentId} disabled={isLoading}>
                    <SelectTrigger id="category-parent"><SelectValue placeholder="Select parent..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">-- No Parent --</SelectItem>
                        {buildCategoryOptions(flatCategoryList).map(opt => (
                            <SelectItem key={opt.value} value={opt.value} disabled={initialData?.id.toString() === opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div>
                <Label htmlFor="category-description">Description (Optional)</Label>
                <Textarea id="category-description" value={description ?? ''} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)} disabled={isLoading} rows={3} />
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>Cancel</Button>
                <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : (initialData ? 'Save Changes' : 'Create Category')}</Button>
            </DialogFooter>
        </form>
    );
};

const AdminCategoryManagementPage: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
    const [formIsLoading, setFormIsLoading] = useState(false);

    const fetchCategories = async () => {
        setIsLoading(true);
        setError(null);
        const response = await makeRequest<Category[]>(api.get('/categories'));
        if (response.success && response.data) {
            setCategories(response.data);
        } else {
            setError(response.error?.message || 'Failed to fetch categories.');
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleOpenAddDialog = () => {
        setEditingCategory(null);
        setIsAddEditDialogOpen(true);
    };
    const handleOpenEditDialog = (category: Category) => {
        setEditingCategory(category);
        setIsAddEditDialogOpen(true);
    };
    const handleOpenDeleteDialog = (category: Category) => {
        setDeletingCategory(category);
        setIsDeleteDialogOpen(true);
    };
    const handleCloseDialogs = () => {
        setIsAddEditDialogOpen(false);
        setIsDeleteDialogOpen(false);
        setEditingCategory(null);
        setDeletingCategory(null);
    };

    const handleFormSubmit = async (data: Partial<Category>) => {
        setFormIsLoading(true);
        setError(null);
        const url = editingCategory ? `/admin/categories/${editingCategory.id}` : '/admin/categories';
        const method = editingCategory ? 'put' : 'post';
        const response = await makeRequest<Category>(api[method](url, data));
        if (response.success) {
            await fetchCategories();
            handleCloseDialogs();
        } else {
            console.error("Form submission error:", response.error);
            alert(`Error: ${response.error?.message || 'Failed to save category.'}`);
        }
        setFormIsLoading(false);
    };
    const handleDeleteConfirm = async () => {
        if (!deletingCategory) return;
        setFormIsLoading(true);
        setError(null);
        const response = await makeRequest(api.delete(`/admin/categories/${deletingCategory.id}`));
        if (response.success) {
            await fetchCategories();
            handleCloseDialogs();
        } else {
            console.error("Delete error:", response.error);
            alert(`Error: ${response.error?.message || 'Failed to delete category.'}`);
        }
        setFormIsLoading(false);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Category Management</h1>
                <Dialog open={isAddEditDialogOpen} onOpenChange={setIsAddEditDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={handleOpenAddDialog}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add New Category
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                            <DialogDescription>
                                {editingCategory ? 'Make changes to the category.' : 'Add a new category to the platform.'}
                            </DialogDescription>
                        </DialogHeader>
                        <CategoryForm
                            initialData={editingCategory}
                            allCategories={categories}
                            onSubmit={handleFormSubmit}
                            onCancel={handleCloseDialogs}
                            isLoading={formIsLoading}
                        />
                    </DialogContent>
                </Dialog>
            </div>
            {error && (
                <div className="text-destructive bg-destructive/10 p-4 rounded mb-4 flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2 text-destructive"/>
                    <span className="text-destructive">{error}</span>
                </div>
            )}
            <div className="rounded-md border dark:border-gray-700">
                {isLoading ? (
                    <p className="p-4 text-center">Loading categories...</p>
                ) : categories.length === 0 ? (
                    <p className="p-4 text-center">No top-level categories found.</p>
                ) : (
                    categories.map(category => (
                        <CategoryTreeNode
                            key={category.id}
                            category={category}
                            level={0}
                            onEdit={handleOpenEditDialog}
                            onDelete={handleOpenDeleteDialog}
                        />
                    ))
                )}
            </div>
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. Deleting "{deletingCategory?.name}" might affect subcategories and products.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCloseDialogs} disabled={formIsLoading}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm} disabled={formIsLoading}>
                            {formIsLoading ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminCategoryManagementPage;
