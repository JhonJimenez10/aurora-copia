<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class AgencyDest extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'agencies_dest';

    protected $fillable = [
        'enterprise_id',
        'name',
        'code_letters',
        'trade_name',
        'address',
        'phone',
        'postal_code',
        'city',
        'state',
        'available_us',
        'value',
        'active',
    ];

    protected $casts = [
        'available_us' => 'boolean',
        'active' => 'boolean', // ✅ Agregado
        'value' => 'decimal:2',
    ];
    // Relaciones
    public function enterprise()
    {
        return $this->belongsTo(Enterprise::class);
    }

    public function receptions()
    {
        return $this->hasMany(Reception::class, 'agency_dest', 'id');
    }

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    // Scope para obtener agencias inactivas
    public function scopeInactive($query)
    {
        return $query->where('active', false);
    }
}
