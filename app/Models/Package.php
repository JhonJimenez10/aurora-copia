<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Package extends Model
{
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $casts = [
        'id'             => 'string',
        'reception_id'   => 'string',
        'art_package_id' => 'string',
    ];

    protected $fillable = [
        'reception_id',
        'art_package_id',
        'service_type',
        'content',
        'pounds',
        'kilograms',
        'total',
        'decl_val',
        'ins_val',
        'barcode',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($package) {
            if (empty($package->id)) {
                $package->id = (string) Str::uuid();
            }

            // Generación automática de barcode si no existe
            if (empty($package->barcode) && $package->reception && $package->reception->sender) {
                $prov = strtoupper(substr($package->reception->sender->state ?? '', 0, 2));
                $city = strtoupper(substr($package->reception->sender->city ?? '', 0, 2));
                $receptionNum = preg_replace('/[^0-9]/', '', $package->reception->number ?? '');
                $lastDigits = substr($receptionNum, -4) ?: '0000';
                $currentCount = $package->reception->packages()->count() + 1;

                $package->barcode = "{$prov}{$city}{$lastDigits}.{$currentCount}";
            }
        });
    }

    public function reception()
    {
        return $this->belongsTo(Reception::class);
    }

    public function artPackage()
    {
        return $this->belongsTo(ArtPackage::class);
    }

    public function items()
    {
        return $this->hasMany(PackageItem::class);
    }

    // Alias si prefieres otro nombre
    public function packageItems()
    {
        return $this->hasMany(PackageItem::class);
    }
}
