<?php

namespace App\Http\Controllers\Api;

use App\Events\BidPlaced;
use App\Http\Controllers\Controller;
use App\Models\Auction;
use App\Models\Bid;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BidController extends Controller
{
    public function store(Request $request, Auction $auction)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.01',
        ]);

        if ($auction->status !== 'active') {
            throw ValidationException::withMessages([
                'auction' => ['This auction is not active.'],
            ]);
        }

        if (now()->isAfter($auction->end_date)) {
            throw ValidationException::withMessages([
                'auction' => ['This auction has ended.'],
            ]);
        }

        $currentPrice = $auction->price ?? $auction->reserve_price;
        if ($request->amount <= $currentPrice) {
            throw ValidationException::withMessages([
                'amount' => ['Your bid must be higher than the current price.'],
            ]);
        }

        $minIncrement = $auction->bid_increment;
        if (($request->amount - $currentPrice) < $minIncrement) {
            throw ValidationException::withMessages([
                'amount' => ["Your bid must be at least {$minIncrement} more than the current price."],
            ]);
        }

        try {
            DB::beginTransaction();

            $bid = Bid::create([
                'auction_id' => $auction->id,
                'user_id' => Auth::id(),
                'amount' => $request->amount,
                'is_winning' => true,
                'ip_address' => $request->ip(),
            ]);

            $auction->update([
                'price' => $request->amount,
                'bid_count' => $auction->bid_count + 1,
            ]);

            Bid::where('auction_id', $auction->id)
                ->where('id', '!=', $bid->id)
                ->where('is_winning', true)
                ->update(['is_winning' => false]);

            if ($auction->anti_sniping) {
                $timeLeft = now()->diffInSeconds($auction->end_date);
                if ($timeLeft <= 300) {
                    $auction->update([
                        'end_date' => $auction->end_date->addMinutes(5),
                    ]);
                }
            }

            DB::commit();

            event(new BidPlaced($bid, $auction));

            return response()->json([
                'message' => 'Bid placed successfully',
                'bid' => $bid->load('user:id,name'),
                'auction' => $auction->fresh(['product.images', 'artisan.user']),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            throw ValidationException::withMessages([
                'bid' => ['Failed to place bid. Please try again.'],
            ]);
        }
    }

    public function history(Auction $auction)
    {
        $bids = $auction->bids()
            ->with('user:id,name')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return response()->json($bids);
    }

    public function userHistory()
    {
        $bids = Auth::user()
            ->bids()
            ->with(['auction.product.images', 'auction.artisan.user'])
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return response()->json($bids);
    }
}
