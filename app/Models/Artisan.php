<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Artisan extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'business_name',
        'speciality',
        'location',
        'bio',
        'rating',
        'image',
        'social_media_links',
        'status',
        'id_verification_status',
        'id_verified_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'social_media_links' => 'array',
        'id_verified_at' => 'datetime',
        'rating' => 'decimal:1', // Cast rating to decimal
    ];

    /**
     * Get the user that owns the artisan profile.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the products for the artisan.
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    /**
     * Get the auctions for the artisan.
     */
    public function auctions(): HasMany
    {
        return $this->hasMany(Auction::class);
    }

    /**
     * Get the images for the artisan profile.
     */
    public function images(): HasMany
    {
        return $this->hasMany(ArtisanImage::class);
    }

    /**
     * Get the comments for the artisan profile.
     */
    public function comments(): HasMany
    {
        return $this->hasMany(ArtisanProfileComment::class);
    }
}
