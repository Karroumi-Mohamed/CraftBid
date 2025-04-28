<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['category', 'images', 'artisan.user']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->has('artisan_id')) {
            $query->where('artisan_id', $request->artisan_id);
        }

        $products = $query->latest()->paginate($request->input('per_page', 10));

        return response()->json($products);
    }

    public function show(Product $product)
    {
        return response()->json($product->load(['category', 'images', 'artisan.user']));
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'category_id' => 'sometimes|exists:categories,id',
            'status' => 'sometimes|in:active,inactive,suspended',
        ]);

        $product->update($validated);

        return response()->json([
            'message' => 'Product updated successfully',
            'product' => $product->load(['category', 'images'])
        ]);
    }

    public function suspend(Product $product)
    {
        $product->update(['status' => 'suspended']);

        return response()->json([
            'message' => 'Product has been suspended',
            'product' => $product->load(['category', 'images'])
        ]);
    }

    public function activate(Product $product)
    {
        $hasPrimaryImage = $product->images()->where('is_primary', true)->exists();

        if (!$hasPrimaryImage) {
            return response()->json([
                'message' => 'Cannot activate product: no primary image set',
            ], 422);
        }

        $product->update(['status' => 'active']);

        return response()->json([
            'message' => 'Product has been activated',
            'product' => $product->load(['category', 'images'])
        ]);
    }

    public function deactivate(Product $product)
    {
        $product->update(['status' => 'inactive']);

        return response()->json([
            'message' => 'Product has been deactivated',
            'product' => $product->load(['category', 'images'])
        ]);
    }


    public function destroy(Product $product)
    {
        DB::transaction(function () use ($product) {
            foreach ($product->images as $image) {
                Storage::disk('public')->delete($image->path);
                $image->delete();
            }

            $product->delete();
        });

        return response()->json([
            'message' => 'Product and all its images have been deleted'
        ]);
    }
}
