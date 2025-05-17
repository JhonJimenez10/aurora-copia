<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Invoice extends Model
{
    use HasFactory;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $casts = [
        'id' => 'string',
    ];
    protected $fillable = [
        'enterprise_id',
        'sender_id',
        'reception_id',
        'establishment',
        'emission_point',
        'sequential',
        'number',
        'invoice_type',
        'issue_date',
        'subtotal',
        'discount',
        'vat',
        'total',
        'sri_status',
        'auth_number',
        'access_key',
        'auth_date',
        'observations',
        'xml_url',
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
    public function enterprise()
    {
        return $this->belongsTo(Enterprise::class, 'enterprise_id');
    }

    public function sender()
    {
        return $this->belongsTo(Sender::class, 'sender_id');
    }

    public function reception()
    {
        return $this->belongsTo(Reception::class, 'reception_id');
    }

    public function invDetails()
    {
        return $this->hasMany(InvDetail::class, 'invoice_id');
    }
}
