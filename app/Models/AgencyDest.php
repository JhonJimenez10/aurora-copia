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
}
