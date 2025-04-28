<?php

namespace App\Http\Controllers\Api\Artisan;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\StoreProductImagesRequest;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index()
    {
        $artisan = Auth::user()->artisan;
        if (!$artisan) {
            return response()->json(['message' => 'Artisan not found.'], 404);
        }
        $products = $artisan->products()->with('category', 'images')->latest()->get();
        return response()->json($products);
    }

    public function store(StoreProductRequest $request)
    {
        $validatedData = $request->validated();
        $artisan = Auth::user()->artisan;

        if (!$artisan) {
            return response()->json(['message' => 'Artisan profile not found.'], 404);
        }


        $baseSlug = Str::slug($validatedData['name']);
        $slug = $baseSlug;


        if (Product::where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . time();
        }

        $product = $artisan->products()->create([
            'name' => $validatedData['name'],
            'description' => $validatedData['description'],
            'category_id' => $validatedData['category_id'],
            'status' => 'inactive',
            'slug' => $slug
        ]);

        return response()->json($product->load('category'), 201);
    }

    public function storeImages(StoreProductImagesRequest $request, Product $product)
    {
        $validatedData = $request->validated();
        $imagePaths = [];

        foreach ($validatedData['images'] as $imageFile) {
            $path = $imageFile->store('product_images', 'public');
            $product->images()->create([
                'path' => $path,
            ]);
            $imagePaths[] = Storage::disk('public')->url($path);
        }


        return response()->json([
            'message' => 'Images uploaded successfully.',
            'product' => $product->load('images'),

        ], 201);
    }

    public function setPrimaryImage(Request $request, Product $product, ProductImage $image)
    {

        $artisan = Auth::user()->artisan;
        if (!$artisan) {
            return response()->json(['message' => 'Artisan profile not found.'], 404);
        }


        if ($product->artisan_id !== $artisan->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }


        if ($image->product_id !== $product->id) {
            return response()->json(['message' => 'Image does not belong to this product'], 400);
        }

        try {
            DB::transaction(function () use ($product, $image) {

                $product->images()
                    ->where('id', '!=', $image->id)
                    ->update(['is_primary' => false]);


                $image->is_primary = true;
                $image->save();


                if ($product->status === 'inactive') {
                    $product->status = 'active';
                    $product->save();
                }
            });

            return response()->json([
                'message' => 'Primary image updated successfully.',
                'product' => $product->load('images')
            ], 200);
        } catch (\Exception $e) {

            return response()->json(['message' => 'Failed to update primary image.'], 500);
        }
    }

    public function show(Product $product)
    {

        $artisan = Auth::user()->artisan;
        if (!$artisan || $product->artisan_id !== $artisan->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        return response()->json($product->load('category', 'images'));
    }

    public function update(Request $request, Product $product)
    {

        $artisan = Auth::user()->artisan;
        if (!$artisan || $product->artisan_id !== $artisan->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'category_id' => 'required|exists:categories,id',
        ]);

        if ($product->name !== $validated['name']) {
            $baseSlug = Str::slug($validated['name']);
            $slug = $baseSlug;


            if (Product::where('slug', $slug)->where('id', '!=', $product->id)->exists()) {
                $slug = $baseSlug . '-' . time();
            }

            $validated['slug'] = $slug;
        }

        $product->update($validated);

        return response()->json($product->load('category', 'images'));
    }
    public function destroy(Product $product)
    {

        $artisan = Auth::user()->artisan;
        if (!$artisan || $product->artisan_id !== $artisan->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        foreach ($product->images as $image) {
            Storage::disk('public')->delete($image->path);
            $image->delete();
        }

        $product->delete();

        return response()->json(['message' => 'Product deleted successfully.'], 200);
    }
    public function deleteImage(Request $request, Product $product, ProductImage $image)
    {

        $artisan = Auth::user()->artisan;
        if (!$artisan || $product->artisan_id !== $artisan->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }


        if ($image->product_id !== $product->id) {
            return response()->json(['message' => 'Image does not belong to this product'], 400);
        }


        if ($image->is_primary) {
            return response()->json(['message' => 'Cannot delete the primary image. Set another image as primary first.'], 400);
        }
        Storage::disk('public')->delete($image->path);
        $image->delete();

        return response()->json([
            'message' => 'Image deleted successfully.',
            'product' => $product->load('images')
        ]);
    }

    public function updateStatus(Request $request, Product $product)
    {
        $artisan = Auth::user()->artisan;


        if ($product->artisan_id !== $artisan->id) {
            return response()->json(['message' => 'Unauthorized. This product does not belong to you.'], 403);
        }

        $request->validate([
            'status' => 'required|in:active,inactive',
        ]);

        $newStatus = $request->status;

        if ($newStatus === 'active') {
            $hasPrimaryImage = $product->images()->where('is_primary', true)->exists();

            if (!$hasPrimaryImage) {
                return response()->json([
                    'message' => 'Cannot activate product: no primary image set. Please set a primary image first.',
                ], 422);
            }
        }

        $product->update(['status' => $newStatus]);

        return response()->json([
            'message' => $newStatus === 'active' ? 'Product activated successfully.' : 'Product deactivated successfully.',
            'status' => $product->status,
            'product' => $product->load(['category', 'images'])
        ]);
    }
}
