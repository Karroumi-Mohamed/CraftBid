<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Bid extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'auction_id',
        'user_id',
        'amount',
        'is_winning',
        'ip_address',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'is_winning' => 'boolean',
    ];

    protected $appends = ['status'];

    public function getStatusAttribute()
    {
        if ($this->auction && $this->auction->status === 'ended') {
            if ($this->is_winning) {
                return 'won';
            }
            return 'lost';
        }
        
        if ($this->auction && $this->auction->status === 'active') {
            if ($this->is_winning) {
                return 'winning';
            }
            return 'outbid';
        }
        
        return 'outbid';
    }

    public function auction(): BelongsTo
    {
        return $this->belongsTo(Auction::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
