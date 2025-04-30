<?php

namespace App\Http\Controllers\Api;

use App\Events\BidPlaced;
use App\Http\Controllers\Controller;
use App\Models\Auction;
use App\Models\Bid;
use App\Models\User;
use App\Services\WalletService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class BidController extends Controller
{
    protected WalletService $walletService;

    public function __construct(WalletService $walletService)
    {
        $this->walletService = $walletService;
    }

    public function store(Request $request, Auction $auction)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
        ]);

        $bidder = $request->user();
        $bidAmount = (float)$validated['amount'];

        if (!$bidder->hasVerifiedEmail()) {
            throw ValidationException::withMessages([
                'auth' => ['You must verify your email address before placing a bid.'],
            ]);
        }

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
        
        if($auction->user_id === $bidder->id) {
            throw ValidationException::withMessages([
                'auction' => ['You cannot bid on your own auction.'],
            ]);
        }

        $latestBid = $auction->bids()->latest('created_at')->first();
        $currentPrice = (float)($latestBid->amount ?? $auction->reserve_price);
        
        if ($bidAmount <= $currentPrice) {
            throw ValidationException::withMessages([
                'amount' => ['Your bid must be higher than the current price ($' . number_format($currentPrice, 2) . ').'],
            ]);
        }

        $minIncrement = (float)$auction->bid_increment;
        if (($bidAmount - $currentPrice) < $minIncrement) {
            throw ValidationException::withMessages([
                'amount' => ["Your bid must be at least $" . number_format($minIncrement, 2) . " higher than the current price."],
            ]);
        }
        
        $bidderWallet = $bidder->wallet()->firstOrFail();

        $previousWinningBid = $latestBid && $latestBid->is_winning ? $latestBid : null; 
        $previousWinner = null;
        $previousWinningAmount = 0;
        if ($previousWinningBid && $previousWinningBid->user_id !== $bidder->id) {
            $previousWinner = User::with('wallet')->find($previousWinningBid->user_id);
            if ($previousWinner && $previousWinner->wallet) {
                 $previousWinningAmount = (float)$previousWinningBid->amount;
            } else {
                Log::warning('Previous bid winner or wallet not found during bid release attempt.', ['auction_id' => $auction->id, 'previous_bid_id' => $previousWinningBid->id]);
                $previousWinner = null;
            }
        }

        try {
            DB::beginTransaction();

            if ($previousWinner && $previousWinningAmount > 0) {
                try {
                     $this->walletService->adjustBalance(
                         $previousWinner->wallet,
                         $previousWinningAmount,
                         'bid_release',
                         'completed',
                         'Funds released: Outbid on Auction #' . $auction->id,
                         $auction->id
                     );
                      Log::info('Released bid hold for previous winner.', ['user_id' => $previousWinner->id, 'auction_id' => $auction->id, 'amount' => $previousWinningAmount]);
                } catch (\Exception $e) {
                    Log::error('Failed to release previous winner bid hold.', ['user_id' => $previousWinner->id, 'auction_id' => $auction->id, 'error' => $e->getMessage()]);
                }
            }

             $holdTransaction = $this->walletService->adjustBalance(
                 $bidderWallet,
                 -$bidAmount,
                 'bid_hold',
                 'completed', 
                 'Funds held for bid on Auction #' . $auction->id,
                 $auction->id
             );
             Log::info('Placed bid hold for current bidder.', ['user_id' => $bidder->id, 'auction_id' => $auction->id, 'amount' => $bidAmount]);

            if ($previousWinningBid) {
                 $auction->bids()
                     ->where('id', $previousWinningBid->id)
                     ->update(['is_winning' => false]);
            }
           
            $bid = Bid::create([
                'auction_id' => $auction->id,
                'user_id' => $bidder->id,
                'amount' => $bidAmount,
                'is_winning' => true,
                'ip_address' => $request->ip(),
            ]);

            $auction->update([
                'price' => $bidAmount,
                'bid_count' => $auction->bid_count + 1,
                'winner_id' => $bidder->id,
            ]);

            if ($auction->anti_sniping) {
                $timeLeft = now()->diffInSeconds($auction->end_date);
                if ($timeLeft > 0 && $timeLeft <= 300) {
                    $auction->end_date = $auction->end_date->addMinutes(5);
                    $auction->save();
                    Log::info('Anti-sniping triggered, auction extended.', ['auction_id' => $auction->id, 'new_end_date' => $auction->end_date]);
                }
            }

            DB::commit();
            Log::info('Bid placed successfully with wallet hold.', ['bid_id' => $bid->id, 'user_id' => $bidder->id, 'auction_id' => $auction->id, 'amount' => $bidAmount]);

            event(new BidPlaced($bid->load('user:id,name'), $auction->fresh())); 

            return response()->json([
                'message' => 'Bid placed successfully',
                'bid' => $bid->load('user:id,name'),
                'auction' => $auction->refresh()->load(['product.images', 'artisan.user']),
            ], 201);

        } catch (ValidationException $e) {
            DB::rollBack();
            throw $e;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to place bid due to exception.', ['user_id' => $bidder->id, 'auction_id' => $auction->id, 'error' => $e->getMessage()]);
            if (str_contains($e->getMessage(), 'Insufficient funds')) {
                 throw ValidationException::withMessages([
                    'amount' => ['Insufficient funds in your wallet to place this bid.'],
                 ]);
            } 
            throw ValidationException::withMessages([
                'bid' => ['Failed to place bid due to an unexpected error. Please try again later.'],
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
