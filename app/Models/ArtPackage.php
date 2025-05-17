<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ArtPackage extends Model
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
        'translation',
        'unit_type',
        'unit_price',
        'agent_val',
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

    public function packages()
    {
        return $this->hasMany(Package::class, 'art_package_id');
    }
}
