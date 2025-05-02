<?php

namespace App\Services;

use App\Models\Auction;
use App\Models\User;
use App\Models\Wallet;
use App\Models\Transaction;
use App\Services\WalletService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Helpers\SettingsHelper;
use Exception;

class AuctionPaymentService
{
    protected WalletService $walletService;

    public function __construct(WalletService $walletService)
    {
        $this->walletService = $walletService;
    }

    public function processPayment(Auction $auction): bool
    {
        if ($auction->status !== 'ended' || is_null($auction->winner_id)) {
            Log::warning('Attempted to process payment for non-ended or winnerless auction.', ['auction_id' => $auction->id]);
            return false;
        }

        $buyer = User::find($auction->winner_id);
        $artisanModel = $auction->artisan()->first(); 
        $artisan = $artisanModel ? $artisanModel->user()->with('wallet')->first() : null;

        if (!$buyer || !$artisan || !$artisan->wallet) {
            Log::error('Buyer or Artisan (or their wallet) not found during payment processing.', [
                'auction_id' => $auction->id,
                'buyer_id' => $auction->winner_id,
                'artisan_id' => $auction->artisan_id,
                'found_artisan_user_id' => $artisan->id ?? null
            ]);
            return false;
        }

        // Get the buyer's wallet first
        $buyerWallet = $buyer->wallet()->first();
        if (!$buyerWallet) {
            Log::error('Buyer wallet not found when attempting to find bid_hold transaction.', [
                'auction_id' => $auction->id,
                'buyer_id' => $buyer->id
            ]);
            return false;
        }
        
        $finalPrice = (float)$auction->price;

        $holdTransaction = Transaction::where('auction_id', $auction->id)
            ->where('wallet_id', $buyerWallet->id)
            ->where('type', 'bid_hold')
            ->where('amount', -$finalPrice)
            ->where('status', 'completed')
            ->latest()
            ->first();

        if (!$holdTransaction) {
             Log::error('Could not find the corresponding successful bid_hold transaction for payment processing.', [
                 'auction_id' => $auction->id,
                 'buyer_id' => $buyer->id,
                 'expected_amount' => -$finalPrice,
             ]);
             return false; 
        }

        $commissionRatePercent = (float)SettingsHelper::get('commission_rate_percent', 10); 
        $commissionRate = $commissionRatePercent / 100.0;

        $commission = $finalPrice * $commissionRate;
        $artisanEarnings = $finalPrice - $commission;

        try {
            DB::transaction(function () use ($artisan, $commission, $artisanEarnings, $auction, $holdTransaction, $commissionRate) {
                
                $holdTransaction->update([
                    'type' => 'payment',
                    'description' => 'Payment processed for Auction #' . $auction->id . ' (from bid hold)',
                ]);
                Log::info('Updated bid_hold to payment transaction.', ['transaction_id' => $holdTransaction->id, 'auction_id' => $auction->id]);

                $this->walletService->adjustBalance(
                    $artisan->wallet,
                    $artisanEarnings,
                    'payout',
                    'completed',
                    'Earnings from Auction #' . $auction->id,
                    $auction->id
                );

                 $this->walletService->adjustBalance(
                     $artisan->wallet,
                     -$commission,
                     'commission',
                     'completed',
                     'Platform commission for Auction #' . $auction->id,
                     $auction->id
                  );

                 Log::info('Auction payment processed successfully.', [
                     'auction_id' => $auction->id, 
                     'commission_rate' => $commissionRate,
                     'artisan_payout' => $artisanEarnings,
                     'commission_amount' => $commission
                    ]); 
            });
            return true;
        } catch (Exception $e) {
            Log::error('Failed to process auction payment due to exception.', [
                'auction_id' => $auction->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString() 
            ]);
            return false;
        }
    }
} 