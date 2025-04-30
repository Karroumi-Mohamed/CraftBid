<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\WithdrawalRequest;
use App\Models\User;
use App\Services\WithdrawalService;
use App\Services\WalletService; 
use Illuminate\Http\Request;
use Exception;

class WalletController extends Controller
{
    protected WithdrawalService $withdrawalService;
    protected WalletService $walletService;

    public function __construct(WithdrawalService $withdrawalService, WalletService $walletService)
    {
        $this->withdrawalService = $withdrawalService;
        $this->walletService = $walletService;
    }

    public function indexWithdrawals(Request $request)
    {
        $status = $request->query('status', 'pending');
        $requests = WithdrawalRequest::with('user:id,name,email')
            ->where('status', $status)
            ->latest('requested_at')
            ->paginate(20);

        return response()->json($requests);
    }

    public function approveWithdrawal(Request $request, WithdrawalRequest $withdrawalRequest)
    {
        $validated = $request->validate([
            'admin_notes' => 'nullable|string|max:1000',
        ]);

        try {
            $updatedRequest = $this->withdrawalService->approveWithdrawal($withdrawalRequest, $validated['admin_notes'] ?? null);
            $this->withdrawalService->processWithdrawal($updatedRequest);
            return response()->json(['message' => 'Withdrawal approved and processing initiated.', 'request' => $updatedRequest]);
        } catch (Exception $e) {
            return response()->json(['error' => 'Failed to approve withdrawal: ' . $e->getMessage()], 500);
        }
    }

    public function rejectWithdrawal(Request $request, WithdrawalRequest $withdrawalRequest)
    {
         $validated = $request->validate([
            'reason' => 'required|string|max:1000',
        ]);

        try {
            $updatedRequest = $this->withdrawalService->rejectWithdrawal($withdrawalRequest, $validated['reason']);
            return response()->json(['message' => 'Withdrawal rejected.', 'request' => $updatedRequest]);
        } catch (Exception $e) {
            return response()->json(['error' => 'Failed to reject withdrawal: ' . $e->getMessage()], 500);
        }
    }

     public function manualDeposit(Request $request)
     {
         $validated = $request->validate([
             'user_id' => 'required|exists:users,id',
             'amount' => 'required|numeric|min:0.01',
             'description' => 'nullable|string|max:255',
         ]);

         try {
             $user = User::findOrFail($validated['user_id']);
             $transaction = $this->walletService->manualDeposit(
                 $user,
                 (float)$validated['amount'],
                 $validated['description'] ?? 'Manual deposit by admin'
             );
             return response()->json([
                 'message' => 'Manual deposit successful.',
                 'transaction' => $transaction,
                 'new_balance' => $user->wallet()->first()->balance // Show updated balance
             ], 200);
         } catch (Exception $e) {
             return response()->json(['error' => 'Manual deposit failed: ' . $e->getMessage()], 500);
         }
     }
} 