<?php

namespace App\Services;

use App\Models\Auction;
use App\Models\User;
use App\Models\Wallet;
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

        $buyer = User::with('wallet')->find($auction->winner_id);
        $artisan = User::with('wallet')->find($auction->user_id);

        if (!$buyer || !$buyer->wallet || !$artisan || !$artisan->wallet) {
            Log::error('Buyer or Artisan wallet not found during payment processing.', [
                'auction_id' => $auction->id,
                'buyer_id' => $auction->winner_id,
                'artisan_id' => $auction->user_id
            ]);
            return false;
        }

        if ($buyer->wallet->balance < (float)$auction->price) {
            Log::warning('Buyer has insufficient funds for auction payment.', [
                'auction_id' => $auction->id,
                'buyer_id' => $buyer->id,
                'required_amount' => (float)$auction->price,
                'buyer_balance' => $buyer->wallet->balance
            ]);
            return false;
        }

        $commissionRatePercent = (float)SettingsHelper::get('commission_rate_percent', 10); 
        $commissionRate = $commissionRatePercent / 100.0;

        $finalPrice = (float)$auction->price;

        $commission = $finalPrice * $commissionRate;
        $artisanEarnings = $finalPrice - $commission;

        try {
            DB::transaction(function () use ($buyer, $artisan, $finalPrice, $commission, $artisanEarnings, $auction) {
                $this->walletService->adjustBalance(
                    $buyer->wallet,
                    -$finalPrice, 
                    'payment_sent',
                    'completed',
                    'Payment for Auction #' . $auction->id,
                    $auction->id
                );

                $this->walletService->adjustBalance(
                    $artisan->wallet,
                    $artisanEarnings,
                    'payment_received',
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

                 Log::info('Auction payment processed successfully.', ['auction_id' => $auction->id, 'commission_rate' => $commissionRate]); 
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