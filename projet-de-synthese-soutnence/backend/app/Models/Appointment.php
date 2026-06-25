<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Appointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'lawyer_id',
        'day_index',
        'day_name',
        'date_string',
        'time',
        'status',
        'price',
        'latitude',
        'longitude'
    ];

    protected $casts = [
        'day_index' => 'integer',
        'price' => 'integer',
        'latitude' => 'float',
        'longitude' => 'float',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function lawyer(): BelongsTo
    {
        return $this->belongsTo(Lawyer::class);
    }
}
