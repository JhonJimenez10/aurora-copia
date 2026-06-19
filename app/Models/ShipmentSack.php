<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ShipmentSack extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'shipment_id',
        'transfer_sack_id',
        'sack_number',
        'packages_count',
        'pounds_total',
        'kilograms_total',
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

    public function shipment()
    {
        return $this->belongsTo(Shipment::class);
    }

    public function transferSack()
    {
        return $this->belongsTo(TransferSack::class, 'transfer_sack_id');
    }
}