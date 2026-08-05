<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ShipmentSackPackage extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'shipment_sack_id',
        'package_id',
        'transfer_sack_id',
        'pounds',
        'kilograms',
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

    public function shipmentSack()
    {
        return $this->belongsTo(ShipmentSack::class);
    }

    public function package()
    {
        return $this->belongsTo(Package::class);
    }

    public function transferSack()
    {
        return $this->belongsTo(TransferSack::class, 'transfer_sack_id');
    }
}