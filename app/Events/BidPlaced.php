<?php

namespace App\Events;

use App\Models\Auction;
use App\Models\Bid;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class BidPlaced implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public Bid $bid,
        public Auction $auction
    )
    {
        $this->bid->loadMissing('user');
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        Log::info('Broadcasting on channel: auction.' . $this->auction->id);
        return [
            new Channel('auction.' . $this->auction->id),
        ];
    }
    public function broadcastWith(): array
    {
        $this->bid->loadMissing('user');

        return [
            'bid' => [ 
                'id' => $this->bid->id,
                'auction_id' => $this->bid->auction_id,
                'user_id' => $this->bid->user_id,
                'amount' => $this->bid->amount,
                'created_at' => $this->bid->created_at->toIso8601String(), 
                'user' => [ 
                    'id' => $this->bid->user->id,
                    'name' => $this->bid->user->name,
                ]
            ],
            'auction' => [ 
                 'id' => $this->auction->id,
                 'price' => $this->auction->price, 
                 'bid_count' => $this->auction->bid_count, 
            ],
        ];
    }

    public function broadcastAs(): string
    {
        return 'bid.placed';
    }
}
