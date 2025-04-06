<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'slug',
        'description',
        'category_id',
        'artisan_id',
        'quantity',
        'status',
        'featured',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'featured' => 'boolean',
    ];

    /**
     * Get the artisan that owns the product.
     */
    public function artisan(): BelongsTo
    {
        return $this->belongsTo(Artisan::class);
    }

    /**
     * Get the category that the product belongs to.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get the images for the product.
     */
    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class);
    }

    /**
     * Get the primary image for the product.
     */
    public function primaryImage(): HasOne
    {
        return $this->hasOne(ProductImage::class)->where('is_primary', true);
    }

    /**
     * Get the auctions associated with the product.
     * Typically, a product might only have one active auction at a time,
     * but HasMany allows for historical auctions or potential future scenarios.
     */
    public function auctions(): HasMany
    {
        return $this->hasMany(Auction::class);
    }

    /**
     * Get the currently active auction for the product, if any.
     */
    public function activeAuction(): HasOne
    {
        return $this->hasOne(Auction::class)->where('status', 'active')->latestOfMany();
    }
}
