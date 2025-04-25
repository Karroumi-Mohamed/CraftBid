import React, { useState } from 'react';
type Category = any;

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronRight, ChevronDown, MoreHorizontal, Edit, Trash2 } from 'lucide-react';

interface CategoryTreeNodeProps {
    category: Category;
    level: number;
    onEdit: (category: Category) => void;
    onDelete: (category: Category) => void;
}

const CategoryTreeNode: React.FC<CategoryTreeNodeProps> = ({ category, level, onEdit, onDelete }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasChildren = category.children && category.children.length > 0;

    const handleToggleExpand = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (hasChildren) {
            setIsExpanded(!isExpanded);
        }
    };

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit(category);
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(category);
    };

    return (
        <>
            <div
                className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 group"
                style={{ paddingLeft: `${level * 1.5}rem` }}
            >
                <div className="flex items-center flex-grow py-2 pr-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleToggleExpand}
                        className={`mr-2 p-1 h-6 w-6 ${!hasChildren ? 'invisible' : ''}`}
                        aria-label={isExpanded ? "Collapse" : "Expand"}
                    >
                        {hasChildren ? (
                            isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                        ) : (
                            <span className="w-4 inline-block"></span>
                        )}
                    </Button>
                    <TooltipProvider delayDuration={300}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex-grow truncate cursor-default py-1">
                                    <span className="font-medium">{category.name}</span>
                                </div>
                            </TooltipTrigger>
                            {category.description && (
                                <TooltipContent side="top" align="start" className="max-w-xs">
                                    <p className="text-sm">{category.description}</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <div className="px-4 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={handleEditClick}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={handleDeleteClick}
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                disabled={hasChildren}
                                title={hasChildren ? "Cannot delete category with subcategories" : ""}
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            {isExpanded && hasChildren && (
                <div className="pl-0">
                    {category.children.map((child: Category) => (
                        <CategoryTreeNode
                            key={child.id}
                            category={child}
                            level={level + 1}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </>
    );
};

export default CategoryTreeNode;
