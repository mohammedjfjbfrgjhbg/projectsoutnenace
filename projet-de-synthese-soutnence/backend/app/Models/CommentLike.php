<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommentLike extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'comment_id',
        'is_like', // true = like, false = dislike
    ];

    protected $casts = [
        'is_like' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function comment(): BelongsTo
    {
        return $this->belongsTo(Comment::class);
    }
}
