<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class TransferSack extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'transfer_id',
        'sack_number',
        'refrigerated',
        'seal',
        'packages_count',
        'pounds_total',
        'kilograms_total',
    ];

    protected $casts = [
        'refrigerated' => 'boolean',
    ];

    public function transfer()
    {
        return $this->belongsTo(Transfer::class);
    }

    public function items()
    {
        return $this->hasMany(TransferSackPackage::class);
    }
    public function packages()
    {
        return $this->belongsToMany(Package::class, 'transfer_sack_packages')
            ->withPivot('confirmed', 'pounds', 'kilograms')
            ->withTimestamps();
    }
}
