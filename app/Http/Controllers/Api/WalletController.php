<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WithdrawalRequest;
use App\Services\WithdrawalService;
use App\Services\WalletService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Exception;
use Illuminate\Support\Facades\Log;

class WalletController extends Controller
{
    protected WithdrawalService $withdrawalService;
    protected WalletService $walletService;

    public function __construct(WithdrawalService $withdrawalService, WalletService $walletService)
    {
        $this->withdrawalService = $withdrawalService;
        $this->walletService = $walletService;
    }

 
    public function showBalance(Request $request)
    {
        $user = $request->user();
        $wallet = $user->wallet()->first(); 

        if (!$wallet) {
            return response()->json(['error' => 'Wallet not found.'], 404);
        }

        $bidHoldTotal = $user->bids()
            ->where('is_winning', true)
            ->sum('amount');

        $totalDeposits = $wallet->transactions()
            ->where('type', 'deposit')
            ->where('status', 'completed')
            ->sum('amount');

        $totalWithdrawn = $wallet->transactions()
            ->where('type', 'withdrawal')
            ->where('status', 'completed') 
            ->sum('amount');
        
        return response()->json([
            'balance' => $wallet->balance,
            'bid_hold_total' => $bidHoldTotal,
            'total_deposits' => $totalDeposits,
            'total_withdrawn' => $totalWithdrawn,
            'formatted' => [
                'balance' => number_format($wallet->balance, 2),
                'bid_hold_total' => number_format($bidHoldTotal, 2),
                'total_deposits' => number_format($totalDeposits, 2),
                'total_withdrawn' => number_format($totalWithdrawn, 2),
            ]
        ]);
    }

    public function indexTransactions(Request $request)
    {
        $user = $request->user();
        $wallet = $user->wallet()->firstOrFail();

        $transactions = $wallet->transactions()->latest()->paginate(15); // Get latest first

        return response()->json($transactions);
    }

    public function storeWithdrawalRequest(Request $request)
    {
        $user = $request->user();

        if (!$user->hasRole('artisan')) {
            return response()->json(['error' => 'Only artisans can request withdrawals.'], 403);
        }

        $validated = $request->validate([
            'amount' => 'required|numeric|min:10', 
            'payment_details' => 'required|string|max:1000', 
        ]);

        try {
            $withdrawalRequest = $this->withdrawalService->requestWithdrawal(
                $user,
                (float)$validated['amount'],
                $validated['payment_details']
            );
            return response()->json([
                'message' => 'Withdrawal request submitted successfully.',
                'request' => $withdrawalRequest
            ], 201);
        } catch (Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422); // 422 for validation-like errors (e.g., insufficient funds)
        }
    }

    public function storeManualDeposit(Request $request)
    {
        $user = $request->user();
        $wallet = $user->wallet()->firstOrFail();

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01|max:10000',
        ]);

        $amount = (float)$validated['amount'];

        try {
            $transaction = $this->walletService->adjustBalance(
                $wallet,
                $amount,
                'deposit',
                'completed',
                'Manual deposit by user'
            );

            return response()->json([
                'message' => 'Deposit successful.',
                'transaction' => $transaction,
                'new_balance' => $wallet->fresh()->balance 
            ], 200);
        } catch (Exception $e) {
            Log::error("User manual deposit failed for user {$user->id}: " . $e->getMessage());
            return response()->json(['error' => 'Deposit failed. Please try again later.'], 500);
        }
    }
} 