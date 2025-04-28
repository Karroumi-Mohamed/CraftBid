<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Auction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuctionController extends Controller
{
    public function index(Request $request)
    {
        $query = Auction::with(['product.images', 'artisan.user']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('product', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('id', $search);
            });
        }

        $query->orderBy('created_at', 'desc');

        $auctions = $query->paginate(10);

        return response()->json($auctions);
    }

    public function show(Auction $auction)
    {
        $auction->load(['product.images', 'artisan.user', 'bids.user', 'winner']);

        return response()->json($auction);
    }

    public function update(Request $request, Auction $auction)
    {
        $validated = $request->validate([
            'is_visible' => 'sometimes|boolean',
            'type' => 'sometimes|in:standard,featured',
        ]);

        $auction->update($validated);

        return response()->json([
            'message' => 'Auction updated successfully.',
            'auction' => $auction->fresh(['product.images', 'artisan.user']),
        ]);
    }

    public function toggleFeatured(Auction $auction)
    {
        if (in_array($auction->status, ['ended', 'cancelled']) && $auction->type !== 'featured') {
            return response()->json([
                'message' => 'Ended or canceled auctions cannot be featured',
            ], 422);
        }

        $newType = $auction->type === 'featured' ? 'standard' : 'featured';

        $auction->update(['type' => $newType]);

        return response()->json([
            'message' => $newType === 'featured' ? 'Auction is now featured' : 'Auction is no longer featured',
            'auction' => $auction->fresh(['product.images']),
        ]);
    }

    public function end(Auction $auction)
    {
        if ($auction->status !== 'active') {
            return response()->json([
                'message' => 'Only active auctions can be ended early.',
            ], 422);
        }

        DB::beginTransaction();

        try {
            $auction->update(['status' => 'ended', 'end_date' => now()]);


            DB::commit();

            return response()->json([
                'message' => 'Auction ended successfully.',
                'auction' => $auction->fresh(['product.images', 'winner']),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to end auction.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function cancel(Auction $auction)
    {
        if (!in_array($auction->status, ['pending', 'active'])) {
            return response()->json([
                'message' => 'Only pending or active auctions can be cancelled.',
            ], 422);
        }

        DB::beginTransaction();

        try {
            $auction->update(['status' => 'cancelled']);


            DB::commit();

            return response()->json([
                'message' => 'Auction cancelled successfully.',
                'auction' => $auction->fresh(['product.images']),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to cancel auction.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(Auction $auction)
    {
        DB::beginTransaction();

        try {
            if ($auction->bid_count > 0) {
                return response()->json([
                    'message' => 'Cannot delete auction with existing bids.',
                ], 422);
            }

            $auction->delete();

            DB::commit();

            return response()->json([
                'message' => 'Auction deleted successfully.',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to delete auction.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
