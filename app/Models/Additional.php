<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Additional extends Model
{
    use HasFactory;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $casts = [
        'id' => 'string',
    ];
    protected $fillable = [
        'reception_id',
        'art_packg_id',
        'quantity',
        'unit_price',
        'total',
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
    public function reception()
    {
        return $this->belongsTo(Reception::class, 'reception_id');
    }

    public function artPackg()
    {
        return $this->belongsTo(ArtPackg::class, 'art_packg_id');
    }
}
