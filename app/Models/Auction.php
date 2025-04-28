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

    protected $fillable = [
        'artisan_id',
        'product_id',
        'reserve_price',
        'price',
        'bid_increment',
        'bid_count',
        'quantity',
        'anti_sniping',
        'start_date',
        'end_date',
        'status',
        'winner_id',
        'type',
        'is_visible',
        'properties',
    ];

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

    public function artisan(): BelongsTo
    {
        return $this->belongsTo(Artisan::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function winner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'winner_id');
    }

    public function bids(): HasMany
    {
        return $this->hasMany(Bid::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function watchlists(): HasMany
    {
        return $this->hasMany(Watchlist::class);
    }
}
