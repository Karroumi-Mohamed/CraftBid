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

    protected $fillable = [
        'name',
        'slug',
        'description',
        'category_id',
        'artisan_id',
        'status',
    ];

    protected $casts = [
        'featured' => 'boolean',
    ];
    public function artisan()
    {
        return $this->belongsTo(Artisan::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class);
    }

    public function primaryImage()
    {
        return $this->hasOne(ProductImage::class)->where('is_primary', true);
    }

    public function auctions()
    {
        return $this->hasMany(Auction::class);
    }

    public function activeAuction()
    {
        return $this->hasOne(Auction::class)->where('status', 'active')->latestOfMany();
    }
}
