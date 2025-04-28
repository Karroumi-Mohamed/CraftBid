<?php

namespace App\Console\Commands;

use App\Models\Auction;
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
    protected $description = 'Updates auction statuses based on start and end dates';


    public function handle()
    {
        $this->info('Updating auction statuses...');
        $now = Carbon::now();
        
        $activatedCount = Auction::where('status', 'pending')
            ->where('start_date', '<=', $now)
            ->update(['status' => 'active']);
            
        $this->info("Activated {$activatedCount} auctions.");
        
        $endedCount = Auction::where('status', 'active')
            ->where('end_date', '<=', $now)
            ->update(['status' => 'ended']);
            
        $this->info("Ended {$endedCount} auctions.");
        
        // // 3. Process ended auctions (determine winners, etc.)
        // $endedAuctions = Auction::with(['bids' => function($query) {
        //         $query->orderBy('amount', 'desc');
        //     }])
        //     ->where('status', 'ended')
        //     ->whereNull('winner_id')
        //     ->get();
            
        // $winnersCount = 0;
        
        // foreach ($endedAuctions as $auction) {
        //     $highestBid = $auction->bids->first();
            
        //     if ($highestBid && $highestBid->amount >= $auction->reserve_price) {
        //         $auction->update([
        //             'winner_id' => $highestBid->user_id,
        //             'price' => $highestBid->amount
        //         ]);
                
        //         // Here you could also add logic to:
        //         // - Create notifications for winners and sellers
        //         // - Initialize payment process
        //         // - Update inventory
                
        //         $winnersCount++;
        //     }
        // }
        
        // $this->info("Assigned winners to {$winnersCount} ended auctions.");
        
        // Log::info("Auction status update completed: {$activatedCount} activated, {$endedCount} ended, {$winnersCount} winners assigned.");
        return Command::SUCCESS;
    }
}
