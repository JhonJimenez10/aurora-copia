<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Shipment extends Model
{
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $casts = [
        'id'        => 'string',
        'open'      => 'boolean',
        'date'      => 'date',
        'closed_at' => 'datetime',
    ];

    protected $fillable = [
        'enterprise_id',
        'date',
        'country_origin',
        'agency_origin',
        'sack_prefix',
        'route',
        'airline',
        'number',
        'airport_origin',
        'airport_dest',
        'cargo_agency',
        'palletizer',
        'open',
        'status',
        'created_by',
        'closed_by',
        'closed_at',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    // Relaciones
    public function enterprise()
    {
        return $this->belongsTo(Enterprise::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function closer()
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    // Scopes
    public function scopeOpen($query)
    {
        return $query->where('status', 'OPEN');
    }

    public function scopeClosed($query)
    {
        return $query->where('status', 'CLOSED');
    }
}