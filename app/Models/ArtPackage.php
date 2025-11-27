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
        'canceled' => 'boolean',
        'active' => 'boolean',
        'unit_price' => 'decimal:2',
        'agent_val' => 'decimal:2',
        'arancel' => 'decimal:2',
    ];

    protected $fillable = [
        'enterprise_id',
        'name',
        'translation',
        'codigo_hs',
        'unit_type',
        'unit_price',
        'agent_val',
        'arancel',
        'canceled',
        'active',
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
    // ✅ Scopes
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    public function scopeInactive($query)
    {
        return $query->where('active', false);
    }

    // Scope para obtener artículos activos y no cancelados
    public function scopeAvailable($query)
    {
        return $query->where('active', true)
            ->where('canceled', false);
    }
}
