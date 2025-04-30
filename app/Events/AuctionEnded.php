<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AuctionEnded implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $auctionId,
        public string $winner,
        public float $finalPrice
    )
    {
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('auction.' . $this->auctionId),
        ];
    }

    public function broadcastWith(){
        return [
            'auctionId' => $this->auctionId,
            'winner' => $this->winner,
            'finalPrice' => $this->finalPrice,
        ];
    }

    public function broadcastAs()
    {
        return 'auction.ended';
    }
}
