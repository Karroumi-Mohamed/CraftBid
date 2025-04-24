<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Category::whereNull('parent_id')
                         ->with(['children' => function ($query) {
                             $query->with('children');
                         }])
                         ->orderBy('name')
                         ->get();
        return response()->json($categories);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:categories,name',
            'description' => 'nullable|string',
            'parent_id' => 'nullable|integer|exists:categories,id',
        ]);

        $slug = Str::slug($validated['name']);
        $count = Category::where('slug', 'LIKE', $slug.'%')->count();
        if ($count > 0) {
            $slug = $slug . '-' . ($count + 1);
        }

        $category = Category::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'parent_id' => $validated['parent_id'] ?? null,
        ]);

        return response()->json($category, 201);
    }

    public function show(Category $category)
    {
        $category->load('parent', 'children');
        return response()->json($category);
    }

    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('categories')->ignore($category->id)],
            'description' => 'nullable|string',
            'parent_id' => ['nullable', 'integer', 'exists:categories,id', function ($attribute, $value, $fail) use ($category) {
                if ($value == $category->id) {
                    $fail('A category cannot be its own parent.');
                }
            }],
        ]);

        if (isset($validated['name']) && $validated['name'] !== $category->name) {
            $slug = Str::slug($validated['name']);
            $count = Category::where('slug', 'LIKE', $slug.'%')->where('id', '!=', $category->id)->count();
            if ($count > 0) {
                $slug = $slug . '-' . ($count + 1);
            }
            $validated['slug'] = $slug;
        }

        $category->update($validated);

        return response()->json($category);
    }

    public function destroy(Category $category)
    {
        if ($category->children()->exists()) {
            return response()->json(['message' => 'Cannot delete category because it has subcategories.'], 409);
        }

        try {
            $category->delete();
            return response()->json(['message' => 'Category deleted successfully.'], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to delete category.', 'error' => $e->getMessage()], 500);
        }
    }
}
