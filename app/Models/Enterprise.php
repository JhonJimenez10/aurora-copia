<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Enterprise extends Model
{
    use HasFactory;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $casts = [
        'id' => 'string',
    ];
    protected $fillable = [
        'id',
        'ruc',
        'name',
        'commercial_name',
        'matrix_address',
        'branch_address',
        'province',
        'city',
        'accounting',
        'phone',
        'email',
        'signature',
        'signature_password',
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
    public function users()
    {
        return $this->hasMany(User::class, 'enterprise_id');
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class, 'enterprise_id');
    }
}
