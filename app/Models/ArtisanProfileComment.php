<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ArtisanProfileComment extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'artisan_id',
        'user_id',
        'comment',
        'rating',
    ];

    /**
     * Get the artisan that the comment belongs to.
     */
    public function artisan(): BelongsTo
    {
        return $this->belongsTo(Artisan::class);
    }

    /**
     * Get the user who wrote the comment.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
