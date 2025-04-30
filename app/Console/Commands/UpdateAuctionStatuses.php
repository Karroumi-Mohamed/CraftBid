<?php

namespace App\Console\Commands;

use App\Events\AuctionEnded;
use App\Models\Auction;
use App\Services\AuctionPaymentService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class UpdateAuctionStatuses extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'auction:refresh-statuses';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Updates auction statuses based on start and end dates and processes payments.';

    protected AuctionPaymentService $paymentService;

    public function __construct(AuctionPaymentService $paymentService)
    {
        parent::__construct();
        $this->paymentService = $paymentService;
    }

    public function handle()
    {
        $this->info('Updating auction statuses...');
        $now = Carbon::now();
        
        $activatedCount = Auction::where('status', 'pending')
            ->where('start_date', '<=', $now)
            ->update(['status' => 'active']);
            
        $this->info("Activated {$activatedCount} auctions.");
        
        $auctionsToEnd = Auction::with(['bids' => function($query) {
                $query->orderBy('amount', 'desc');
            }, 'bids.user'])
            ->where('status', 'active')
            ->where('end_date', '<=', $now)
            ->get();
            
        $endedCount = 0;
        $winnersCount = 0;
        
        foreach ($auctionsToEnd as $auction) {
            $highestBid = $auction->bids->first();
            $winnerName = 'No winner';
            $finalPrice = $auction->price;
            $winnerId = null;
            
            if ($highestBid && $highestBid->amount >= $auction->reserve_price) {
                $winnerId = $highestBid->user_id;
                $finalPrice = $highestBid->amount;
                $winnerName = $highestBid->user->name ?? 'Unknown Winner';
                $winnersCount++;
                
                $auction->update([
                    'status' => 'ended',
                    'winner_id' => $winnerId,
                    'price' => $finalPrice
                ]);
                $endedCount++;
                
                Log::info("Attempting payment processing for Auction ID: {$auction->id}");
                $paymentSuccess = $this->paymentService->processPayment($auction);
                if ($paymentSuccess) {
                    Log::info("Payment processed successfully for Auction ID: {$auction->id}");
                } else {
                    Log::warning("Payment processing failed for Auction ID: {$auction->id}");
                }
                
                AuctionEnded::dispatch(
                    $auction->id,
                    $winnerName,
                    (float)$finalPrice
                );
                Log::info("Dispatched AuctionEnded event for Auction ID: {$auction->id} - Winner: {$winnerName}");
                
                // TODO: Add logic for winner/seller notifications (maybe dispatch other events/notifications)
                
            } else {
                $auction->update(['status' => 'ended']);
                $endedCount++;
                
                AuctionEnded::dispatch(
                    $auction->id,
                    $winnerName,
                    (float)$finalPrice
                );
                Log::info("Dispatched AuctionEnded event for Auction ID: {$auction->id} - No Winner");
            }
        }
        
        $this->info("Processed {$endedCount} auctions to ended status.");
        $this->info("Assigned winners to {$winnersCount} ended auctions.");
        
        Log::info("Auction status update completed: {$activatedCount} activated, {$endedCount} ended, {$winnersCount} winners assigned.");
        return Command::SUCCESS;
    }
}
