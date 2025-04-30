<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\Wallet;
use App\Models\WithdrawalRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class FinancialReportController extends Controller
{
    public function getSummary(Request $request)
    {
        $totalRevenue = Transaction::where('type', 'commission')->sum(DB::raw('ABS(amount)'));

        $totalVolume = Transaction::where('type', 'payment_sent')->sum(DB::raw('ABS(amount)'));

        $pendingWithdrawals = WithdrawalRequest::whereIn('status', ['pending', 'approved', 'processing'])->sum('amount');

        $totalUserBalances = Wallet::where('is_active', true)->sum('balance');

        return response()->json([
            'totalRevenue' => (float)$totalRevenue,
            'totalVolumeTransacted' => (float)$totalVolume,
            'pendingWithdrawalsTotal' => (float)$pendingWithdrawals,
            'totalUserBalances' => (float)$totalUserBalances,
        ]);
    }

    public function listAllTransactions(Request $request)
    {
        $query = Transaction::with('wallet.user:id,name,email')->latest(); // Eager load user info

        if ($request->has('user_id')) {
            $query->whereHas('wallet', function ($q) use ($request) {
                $q->where('user_id', $request->input('user_id'));
            });
        }
        if ($request->has('type')) {
            $query->where('type', $request->input('type'));
        }
         if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }
        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', Carbon::parse($request->input('date_from')));
        }
        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', Carbon::parse($request->input('date_to')));
        }

        $transactions = $query->paginate($request->input('per_page', 25));

        return response()->json($transactions);
    }

    public function getRevenueTrend(Request $request)
    {
        $endDate = Carbon::today();
        $startDate = $request->input('start_date') ? Carbon::parse($request->input('start_date')) : $endDate->copy()->subDays(29);

        $revenueData = Transaction::where('type', 'commission')
            ->whereBetween('created_at', [$startDate->startOfDay(), $endDate->endOfDay()])
            ->selectRaw('DATE(created_at) as date, SUM(ABS(amount)) as daily_revenue')
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

         $trend = [];
         $currentDate = $startDate->copy();
         $revenueMap = $revenueData->keyBy(fn($item) => Carbon::parse($item->date)->toDateString());

         while ($currentDate <= $endDate) {
            $dateStr = $currentDate->toDateString();
            $trend[] = [
                'date' => $dateStr,
                'revenue' => (float)($revenueMap[$dateStr]->daily_revenue ?? 0),
            ];
            $currentDate->addDay();
         }

        return response()->json($trend);
    }
}
