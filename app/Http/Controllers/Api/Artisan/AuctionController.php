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
        $minDurationHours = (int)SettingsHelper::get('min_auction_duration_hours', 1);
        $maxDurationDays = (int)SettingsHelper::get('max_auction_duration_days', 14);
        $maxDurationHours = $maxDurationDays * 24;

        $rules = [
            'product_id' => 'required|integer|exists:products,id',
            'reserve_price' => 'required|numeric|min:1',
            'bid_increment' => 'required|numeric|min:0.01',
            'quantity' => 'integer|min:1',
            'is_visible' => 'boolean',
            'properties' => 'nullable|json',
            'start_now' => 'boolean',
            'end_date' => 'required_without:end_after_hours|nullable|date',
            'end_after_hours' => 'required_without:end_date|nullable|integer|min:' . $minDurationHours . '|max:' . $maxDurationHours,
        ];

        if (!$request->input('start_now', false)) {
            $rules['start_date'] = 'required|date';
        }

        $validator = validator($request->all(), $rules);

        $validator->after(function ($validator) use ($request, $minDurationHours, $maxDurationHours) {
            $now = Carbon::now();
            $startDate = $request->input('start_now', false) ? $now : new Carbon($request->start_date);

            if (!$request->input('start_now', false) && $startDate->lt($now)) {
                $validator->errors()->add('start_date', 'The auction start date must be in the future.');
            }

            $endDate = null;
            $durationHours = null;
            if ($request->filled('end_date')) {
                $endDate = new Carbon($request->end_date);
                if ($endDate->lte($startDate)) {
                    $validator->errors()->add('end_date', 'End date must be after start date.');
                    return;
                }
                $durationHours = $startDate->diffInHours($endDate);
            } elseif ($request->filled('end_after_hours')) {
                $durationHours = (int)$request->end_after_hours;
                $endDate = (clone $startDate)->addHours($durationHours);
            } else {
                $validator->errors()->add('end_date', 'Either End Date or End After Hours is required.');
                return;
            }

            if ($durationHours < $minDurationHours) {
                $validator->errors()->add(
                    'end_after_hours',
                    "The auction must run for at least {$minDurationHours} hour(s)."
                );
            }

            if ($durationHours > $maxDurationHours) {
                $validator->errors()->add(
                    'end_after_hours',
                    "The auction cannot run for more than {$maxDurationHours} hours ({$maxDurationDays} days)."
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

        $startDate = $request->input('start_now', false) ? Carbon::now() : new Carbon($validatedData['start_date']);
        if ($request->filled('end_after_hours')) {
            $endDate = (clone $startDate)->addHours((int)$validatedData['end_after_hours']);
        } else {
            $endDate = new Carbon($validatedData['end_date']);
        }

        DB::beginTransaction();
        try {
            $auction = new Auction([
                'artisan_id' => $artisan->id,
                'product_id' => $product->id,
                'reserve_price' => $validatedData['reserve_price'],
                'price' => $validatedData['reserve_price'],
                'bid_increment' => $validatedData['bid_increment'],
                'quantity' => $request->has('quantity') ? $validatedData['quantity'] : 1,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'status' => $request->input('start_now', false) ? 'active' : 'pending',
                'type' => 'standard',
                'anti_sniping' => true,
                'is_visible' => $request->has('is_visible') ? $validatedData['is_visible'] : true,
                'properties' => $request->properties ?? null,
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
