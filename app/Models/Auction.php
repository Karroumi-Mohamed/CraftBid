<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Auction extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'artisan_id',
        'product_id',
        'reserve_price',
        'price',
        'bid_increment',
        'bid_count',
        'anti_sniping',
        'start_date',
        'end_date',
        'status',
        'winner_id',
        'type',
        'is_visible',
        'properties',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'reserve_price' => 'decimal:2',
        'price' => 'decimal:2',
        'bid_increment' => 'decimal:2',
        'anti_sniping' => 'boolean',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'is_visible' => 'boolean',
        'properties' => 'array',
    ];

    /**
     * Get the artisan that created the auction.
     */
    public function artisan(): BelongsTo
    {
        return $this->belongsTo(Artisan::class);
    }

    /**
     * Get the product being auctioned.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get the user who won the auction.
     */
    public function winner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'winner_id');
    }

    /**
     * Get the bids for the auction.
     */
    public function bids(): HasMany
    {
        return $this->hasMany(Bid::class);
    }

    /**
     * Get the transactions associated with the auction.
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

     /**
     * Get the watchlist entries for this auction.
     */
    public function watchlists(): HasMany
    {
        return $this->hasMany(Watchlist::class);
    }
}
