<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LawyerCase extends Model
{
    use HasFactory;

    protected $fillable = [
        'lawyer_id',
        'client_id',
        'client_name',
        'case_number',
        'case_type',
        'status',
        'progress',
        'session_date',
        'notes',
    ];

    public function lawyer(): BelongsTo
    {
        return $this->belongsTo(Lawyer::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id');
    }
}
