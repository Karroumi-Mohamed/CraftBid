<?php

namespace App\Http\Controllers\Api\Artisan;

use App\Http\Controllers\Controller;
use App\Models\Auction;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Helpers\SettingsHelper;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;

class AuctionController extends Controller
{
    public function index()
    {
        $artisan = Auth::user()->artisan;
        if (!$artisan) {
            return response()->json(['message' => 'Artisan not found.'], 404);
        }

        $auctions = $artisan->auctions()
            ->with(['product.images', 'winner'])
            ->latest()
            ->get();

        return response()->json($auctions);
    }

    public function store(Request $request)
    {
        $minDurationMinutes = (int)SettingsHelper::get('min_auction_duration_minutes', 1);
        $maxDurationHours = (int)SettingsHelper::get('max_auction_duration_hours', 336);
        $maxDurationMinutes = $maxDurationHours * 60;

        $rules = [
            'product_id' => 'required|integer|exists:products,id',
            'reserve_price' => 'required|numeric|min:1',
            'bid_increment' => 'required|numeric|min:0.01',
            'quantity' => 'sometimes|integer|min:1',
            'is_visible' => 'sometimes|boolean',
            'properties' => 'nullable|json',
            'start_now' => 'sometimes|boolean',
            'start_date' => 'required_if:start_now,false|nullable|date',
            'end_date' => 'required|date',
        ];

        $validator = validator($request->all(), $rules);

        $validator->after(function ($validator) use ($request, $minDurationMinutes, $maxDurationMinutes) {
            $now = Carbon::now();
            $startDate = null;
            $endDate = null;

            if ($request->input('start_now', false)) {
                $startDate = $now;
            } elseif ($request->filled('start_date')) {
                try {
                    $startDate = Carbon::parse($request->start_date);
                    if ($startDate->lt($now->subMinute())) {
                        $validator->errors()->add('start_date', 'The auction start date cannot be in the past.');
                    }
                } catch (\Exception $e) {
                    $validator->errors()->add('start_date', 'Invalid start date format.');
                    return;
                }
            } else {
                $validator->errors()->add('start_date', 'Start date is required if Start Now is not checked.');
                return;
            }

            if ($request->filled('end_date')) {
                try {
                    $endDate = Carbon::parse($request->end_date);
                } catch (\Exception $e) {
                    $validator->errors()->add('end_date', 'Invalid end date format.');
                    return;
                }
            } else {
                $validator->errors()->add('end_date', 'End date is required.');
                return;
            }

                if ($endDate->lte($startDate)) {
                    $validator->errors()->add('end_date', 'End date must be after start date.');
                return;
            }

            $durationMinutes = $startDate->diffInMinutes($endDate);

            if ($durationMinutes < $minDurationMinutes) {
                $validator->errors()->add(
                    'end_date',
                    "The auction must run for at least {$minDurationMinutes} minute(s)."
                );
            }

            if ($durationMinutes > $maxDurationMinutes) {
                $validator->errors()->add(
                    'end_date',
                    "The auction cannot run for more than {$maxDurationMinutes} minutes ({$maxDurationHours} hours)."
                );
            }
        });

        if ($validator->fails()) {
            return response()->json([
                'message' => 'The given data was invalid.',
                'errors' => $validator->errors()
            ], 422);
        }

        $validatedData = $validator->validated();

        $artisan = Auth::user()->artisan;
        if (!$artisan) {
            return response()->json(['message' => 'Artisan profile not found.'], 404);
        }

        $product = Product::find($validatedData['product_id']);
        if (!$product || $product->artisan_id !== $artisan->id) {
            return response()->json(['message' => 'Product not found or does not belong to you.'], 403);
        }

        $hasPrimaryImage = $product->images()->where('is_primary', true)->exists();
        if (!$hasPrimaryImage) {
            return response()->json([
                'message' => 'Cannot create auction: product has no primary image. Please add a primary image first.',
            ], 422);
        }

        $existingAuction = Auction::where('product_id', $product->id)
            ->whereIn('status', ['pending', 'active'])
            ->exists();

        if ($existingAuction) {
            return response()->json([
                'message' => 'This product already has an active or scheduled auction.',
            ], 422);
        }

        $startDate = $request->input('start_now', false) ? Carbon::now() : Carbon::parse($validatedData['start_date']);
        $endDate = Carbon::parse($validatedData['end_date']);

        DB::beginTransaction();
        try {
            $auction = new Auction([
                'artisan_id' => $artisan->id,
                'product_id' => $product->id,
                'reserve_price' => $validatedData['reserve_price'],
                'price' => $validatedData['reserve_price'],
                'bid_increment' => $validatedData['bid_increment'],
                'quantity' => $request->input('quantity', 1),
                'start_date' => $startDate,
                'end_date' => $endDate,
                'status' => $request->input('start_now', false) ? 'active' : 'pending',
                'type' => 'standard',
                'anti_sniping' => true,
                'is_visible' => $request->input('is_visible', true),
                'properties' => $request->input('properties'),
            ]);

            $auction->save();

            DB::commit();

            return response()->json([
                'message' => 'Auction created successfully.',
                'auction' => $auction->load('product.images'),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create auction.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(Auction $auction)
    {
        $artisan = Auth::user()->artisan;

        if ($auction->artisan_id !== $artisan->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $auction->load(['product.images', 'bids.user', 'winner']);

        return response()->json($auction);
    }

    public function cancel(Auction $auction)
    {
        $artisan = Auth::user()->artisan;

        if ($auction->artisan_id !== $artisan->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($auction->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending auctions can be cancelled.',
            ], 422);
        }

        $auction->update(['status' => 'cancelled']);

        return response()->json([
            'message' => 'Auction cancelled successfully.',
            'auction' => $auction->fresh(),
        ]);
    }

    public function toggleVisibility(Auction $auction)
    {
        $artisan = Auth::user()->artisan;

        if ($auction->artisan_id !== $artisan->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $auction->update(['is_visible' => !$auction->is_visible]);

        return response()->json([
            'message' => $auction->is_visible ? 'Auction is now visible to buyers.' : 'Auction is now hidden from buyers.',
            'auction' => $auction->fresh(),
        ]);
    }
}
