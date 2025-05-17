<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class PackageItem extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'package_id',
        'art_package_id',
        'quantity',
        'unit',
        'volume',
        'length',
        'width',
        'height',
        'weight',
        'pounds',
        'kilograms',
        'unit_price',
        'total',
        'decl_val',
        'ins_val',
    ];

    protected static function booted()
    {
        static::creating(function ($model) {
            $model->id = (string) Str::uuid();
        });
    }

    public function package(): BelongsTo
    {
        return $this->belongsTo(Package::class);
    }

    public function artPackage(): BelongsTo
    {
        return $this->belongsTo(ArtPackage::class, 'art_package_id');
    }
}
