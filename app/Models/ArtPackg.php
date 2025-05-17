<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ArtPackg extends Model
{
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $casts = [
        'id' => 'string',
    ];

    protected $fillable = [
        'enterprise_id',
        'name',
        'unit_type',
        'unit_price',
        'canceled',
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

    public function enterprise()
    {
        return $this->belongsTo(Enterprise::class);
    }

    public function additionals()
    {
        return $this->hasMany(Additional::class, 'art_packg_id');
    }
}
