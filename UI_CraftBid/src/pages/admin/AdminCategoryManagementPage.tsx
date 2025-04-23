import React, { useState, useEffect, useMemo } from 'react';
import api, { makeRequest, ApiResponse } from '@/lib/axois';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Use Shadcn Input
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose, // Import DialogClose
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel, // For filtering
    getPaginationRowModel, // For pagination
    getSortedRowModel, // For sorting
    SortingState,
    VisibilityState, // For column visibility
    useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, PlusCircle, Trash2, Edit } from "lucide-react";
import { Label } from '@/components/ui/label'; // Use Shadcn Label
import { Textarea } from '@/components/ui/textarea'; // Use Shadcn Textarea
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"; // Use Shadcn Select


// Define Category interface based on backend model
interface Category {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    parent_id: number | null;
    parent?: Category | null; // Optional parent object if loaded
    // Add image, created_at, updated_at if needed
}

// --- Category Form Component (for Add/Edit Dialog) ---
interface CategoryFormProps {
    initialData?: Category | null; // For editing
    allCategories: Category[]; // For parent selection
    onSubmit: (data: Partial<Category>) => Promise<void>; // Async submit handler
    onCancel: () => void;
    isLoading: boolean;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ initialData, allCategories, onSubmit, onCancel, isLoading }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [parentId, setParentId] = useState<string>(initialData?.parent_id?.toString() || ''); // Store as string for Select
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormErrors({}); // Clear previous errors

        const dataToSubmit: Partial<Category> = {
            name,
            description: description || null, // Send null if empty
            parent_id: parentId ? parseInt(parentId, 10) : null, // Convert back to number or null
        };

        // Basic frontend validation (can be enhanced)
        if (!name.trim()) {
            setFormErrors({ name: 'Name is required.' });
            return;
        }

        await onSubmit(dataToSubmit); // Call the provided submit handler
    };

    // Filter out the current category and its descendants for parent selection during edit
    const availableParents = useMemo(() => {
        if (!initialData) return allCategories; // Show all for new category
        // Basic filter: exclude self (add descendant check if needed)
        return allCategories.filter(cat => cat.id !== initialData.id);
    }, [allCategories, initialData]);

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="category-name">Name</Label>
                <Input
                    id="category-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    required
                    className={formErrors.name ? 'border-destructive' : ''}
                />
                {formErrors.name && <p className="text-sm text-destructive mt-1">{formErrors.name}</p>}
            </div>
            <div>
                <Label htmlFor="category-parent">Parent Category (Optional)</Label>
                <Select
                    value={parentId}
                    onValueChange={setParentId}
                    disabled={isLoading}
                >
                    <SelectTrigger id="category-parent">
                        <SelectValue placeholder="Select parent..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">-- No Parent --</SelectItem>
                        {availableParents.map(cat => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                                {cat.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div>
                <Label htmlFor="category-description">Description (Optional)</Label>
                <Textarea
                    id="category-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isLoading}
                    rows={3}
                />
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>Cancel</Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : (initialData ? 'Save Changes' : 'Create Category')}
                </Button>
            </DialogFooter>
        </form>
    );
};


// --- Main Category Management Page ---
const AdminCategoryManagementPage: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<any[]>([]); // Use any[] for simplicity
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});

    // State for Dialogs
    const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
    const [formIsLoading, setFormIsLoading] = useState(false); // Loading state for form submissions

    // Fetch categories function
    const fetchCategories = async () => {
        setIsLoading(true);
        setError(null);
        const response = await makeRequest<Category[]>(api.get('/admin/categories'));
        if (response.success && response.data) {
            setCategories(response.data);
        } else {
            setError(response.error?.message || 'Failed to fetch categories.');
        }
        setIsLoading(false);
    };

    // Fetch categories on mount
    useEffect(() => {
        fetchCategories();
    }, []);

    // --- Dialog Handlers ---
    const handleOpenAddDialog = () => {
        setEditingCategory(null); // Ensure we are adding, not editing
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

    // --- API Action Handlers ---
    const handleFormSubmit = async (data: Partial<Category>) => {
        setFormIsLoading(true);
        setError(null); // Clear main page error

        const url = editingCategory
            ? `/admin/categories/${editingCategory.id}`
            : '/admin/categories';
        const method = editingCategory ? 'put' : 'post';

        const response = await makeRequest<Category>(api[method](url, data));

        if (response.success) {
            await fetchCategories(); // Refresh list on success
            handleCloseDialogs();
        } else {
            // TODO: Handle validation errors within the form itself
            console.error("Form submission error:", response.error);
            // For now, show a general error (enhance later)
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
            await fetchCategories(); // Refresh list
            handleCloseDialogs();
        } else {
            console.error("Delete error:", response.error);
            alert(`Error: ${response.error?.message || 'Failed to delete category.'}`);
        }
        setFormIsLoading(false);
    };


    // --- Table Column Definitions ---
    const columns: ColumnDef<Category>[] = [
        // Add Checkbox column if needed for bulk actions
        // {
        //   id: "select",
        //   header: ({ table }) => (...),
        //   cell: ({ row }) => (...),
        // },
        {
            accessorKey: "name",
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    Name <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
        },
        {
            accessorKey: "parent.name", // Access nested data
            header: "Parent",
            cell: ({ row }) => row.original.parent?.name || '--', // Display parent name or '--'
        },
        {
            accessorKey: "slug",
            header: "Slug",
        },
        {
            accessorKey: "description",
            header: "Description",
            cell: ({ row }) => <span className="truncate block max-w-xs">{row.original.description || '--'}</span>, // Truncate long descriptions
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const category = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleOpenEditDialog(category)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleOpenDeleteDialog(category)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    // --- React Table Instance ---
    const table = useReactTable({
        data: categories,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    });

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
                            allCategories={categories} // Pass all categories for parent selection
                            onSubmit={handleFormSubmit}
                            onCancel={handleCloseDialogs}
                            isLoading={formIsLoading}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filtering Input */}
            <div className="flex items-center py-4">
                <Input
                    placeholder="Filter by name..."
                    value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("name")?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />
                {/* Add more filters or column visibility toggle here if needed */}
            </div>

            {/* Error Display */}
            {error && (
                 <div className="text-red-600 bg-red-100 p-4 rounded mb-4 flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2"/>
                    <span>{error}</span>
                 </div>
            )}

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    Loading categories...
                                </TableCell>
                            </TableRow>
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No categories found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    Next
                </Button>
            </div>

             {/* Delete Confirmation Dialog */}
             <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete the category
                             "{deletingCategory?.name}". Associated products might be affected.
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
