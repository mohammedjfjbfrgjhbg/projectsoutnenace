<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lawyer extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'initial',
        'field',
        'field_key',
        'city',
        'rating',
        'reviews',
        'tags',
        'price',
        'available',
        'avatar_color',
        'latitude',
        'longitude',
        'cin_front',
        'cin_back',
        'selfie',
        'bar_number',
        'bar_city',
        'professional_doc',
        'verification_status',
        'rejection_reason',
        'reviewed_at',
        'reviewed_by',
        'reviews_json'
    ];

    protected $casts = [
        'tags' => 'array',
        'reviews_json' => 'array',
        'available' => 'boolean',
        'rating' => 'float',
        'reviews' => 'integer',
        'price' => 'integer',
        'latitude' => 'float',
        'longitude' => 'float',
        'reviewed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }
}
