<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Recipient extends Model
{
    use HasFactory;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $casts = [
        'id' => 'string',
    ];
    protected $fillable = [
        'country',
        'id_type',
        'identification',
        'full_name',
        'address',
        'phone',
        'whatsapp',
        'email',
        'postal_code',
        'city',
        'canton',
        'state',
        'blocked',
        'alert',
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
    public function receptions()
    {
        return $this->hasMany(Reception::class, 'recipient_id');
    }
}
