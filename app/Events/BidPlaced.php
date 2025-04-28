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
        return [
            'bid' => $this->bid,
            'auction' => $this->auction,
            'createdAt' => $this->bid->created_at->format('Y-m-d H:i:s'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'bid.placed';
    }
}
