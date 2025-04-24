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
        'id_document_front_path',
        'id_document_back_path',
    ];

    protected $casts = [
        'social_media_links' => 'array',
        'id_verified_at' => 'datetime',
        'rating' => 'decimal:1',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function auctions(): HasMany
    {
        return $this->hasMany(Auction::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ArtisanImage::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(ArtisanProfileComment::class);
    }
}
