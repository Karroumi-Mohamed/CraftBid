<?php

namespace App\Services;

use App\Models\Wallet;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class WalletService
{
    public function adjustBalance(Wallet $wallet, float $amount, string $type, string $status = 'completed', ?string $description = null, ?int $auctionId = null): Transaction
    {
        return DB::transaction(function () use ($wallet, $amount, $type, $status, $description, $auctionId) {
            $wallet = Wallet::where('id', $wallet->id)->lockForUpdate()->firstOrFail();

            $newBalance = $wallet->balance + $amount;

            if ($newBalance < 0) {
                Log::warning('Wallet balance adjustment failed: Insufficient funds.', [
                    'wallet_id' => $wallet->id,
                    'user_id' => $wallet->user_id,
                    'current_balance' => $wallet->balance,
                    'adjustment_amount' => $amount
                ]);
                throw new Exception('Insufficient funds.');
            }

            $transaction = Transaction::create([
                'wallet_id' => $wallet->id,
                'amount' => $amount,
                'type' => $type,
                'status' => $status,
                'description' => $description,
                'auction_id' => $auctionId, 
            ]);

            $wallet->balance = $newBalance;
            $wallet->save();

            Log::info('Wallet balance adjusted successfully.', [
                'wallet_id' => $wallet->id,
                'user_id' => $wallet->user_id,
                'transaction_id' => $transaction->id,
                'type' => $type,
                'amount' => $amount,
                'new_balance' => $newBalance
            ]);

            return $transaction;
        });
    }

    public function manualDeposit(User $user, float $amount, string $description = 'Manual deposit by admin'): Transaction
    {
        if ($amount <= 0) {
            throw new Exception('Deposit amount must be positive.');
        }
        $wallet = $user->wallet()->firstOrFail(); 

        return $this->adjustBalance($wallet, $amount, 'manual_deposit', 'completed', $description);
    }
} 