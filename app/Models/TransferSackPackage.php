<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class TransferSackPackage extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'transfer_sack_id',
        'package_id',
        'pounds',
        'kilograms',
        'confirmed',
    ];
    protected $casts = [
        'confirmed' => 'boolean',
    ];
    public function sack()
    {
        return $this->belongsTo(TransferSack::class, 'transfer_sack_id');
    }

    public function package()
    {
        return $this->belongsTo(Package::class);
    }
}
