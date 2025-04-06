<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ArtisanImage extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'artisan_id',
        'path',
    ];

    /**
     * Get the artisan that owns the image.
     */
    public function artisan(): BelongsTo
    {
        return $this->belongsTo(Artisan::class);
    }
}
