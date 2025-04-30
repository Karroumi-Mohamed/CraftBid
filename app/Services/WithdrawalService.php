<?php

namespace App\Services;

use App\Models\User;
use App\Models\WithdrawalRequest;
use App\Services\WalletService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class WithdrawalService
{
    protected WalletService $walletService;

    public function __construct(WalletService $walletService)
    {
        $this->walletService = $walletService;
    }

    public function requestWithdrawal(User $user, float $amount, ?string $paymentDetails): WithdrawalRequest
    {
        $wallet = $user->wallet()->firstOrFail();

        if ($amount <= 0) {
            throw new Exception('Withdrawal amount must be positive.');
        }

        if ($wallet->balance < $amount) {
            throw new Exception('Insufficient funds for withdrawal request.');
        }

        return WithdrawalRequest::create([
            'user_id' => $user->id,
            'wallet_id' => $wallet->id,
            'amount' => $amount,
            'payment_details' => $paymentDetails,
            'status' => 'pending',
            'requested_at' => now(),
        ]);
    }

    public function approveWithdrawal(WithdrawalRequest $request, ?string $adminNotes = null): WithdrawalRequest
    {
        if ($request->status !== 'pending') {
            throw new Exception('Withdrawal request is not pending.');
        }

        $request->update([
            'status' => 'approved',
            'admin_notes' => $adminNotes,
        ]);

        Log::info('Withdrawal request approved.', ['withdrawal_request_id' => $request->id]);
        return $request;
    }

    public function rejectWithdrawal(WithdrawalRequest $request, string $reason = 'Rejected by admin'): WithdrawalRequest
    {
        if ($request->status !== 'pending') {
            throw new Exception('Withdrawal request is not pending.');
        }

        $request->update([
            'status' => 'rejected',
            'admin_notes' => $reason,
            'processed_at' => now(),
        ]);
        Log::info('Withdrawal request rejected.', ['withdrawal_request_id' => $request->id]);
        return $request;
    }

    public function processWithdrawal(WithdrawalRequest $request): WithdrawalRequest
    {
         if ($request->status !== 'approved') {
            throw new Exception('Withdrawal request is not approved for processing.');
        }

        return DB::transaction(function () use ($request) {
            $wallet = $request->wallet()->lockForUpdate()->firstOrFail();
            $amountToDeduct = $request->amount;

            if ($wallet->balance < $amountToDeduct) {
                 $request->update(['status' => 'failed', 'admin_notes' => 'Insufficient funds at time of processing.']);
                Log::error('Insufficient funds during withdrawal processing.', ['withdrawal_request_id' => $request->id]);
                throw new Exception('Insufficient funds during processing.');
            }

             $this->walletService->adjustBalance(
                 $wallet,
                 -$amountToDeduct,
                 'withdrawal',
                 'completed',
                 'Withdrawal Request #' . $request->id
             );

            $request->update([
                'status' => 'processing',
                'processed_at' => now(),
            ]);

            Log::info('Withdrawal request processing initiated and funds deducted.', ['withdrawal_request_id' => $request->id]);
            return $request;
        });

    }

    public function completeWithdrawal(WithdrawalRequest $request): WithdrawalRequest
    {
         if (!in_array($request->status, ['processing', 'approved'])) {
             throw new Exception('Withdrawal not in a state to be marked completed.');
         }
         $request->update(['status' => 'completed']);
         Log::info('Withdrawal request marked as completed.', ['withdrawal_request_id' => $request->id]);
         return $request;
    }
} 