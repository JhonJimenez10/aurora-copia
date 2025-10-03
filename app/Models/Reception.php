<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Reception extends Model
{
    use HasFactory;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $casts = [
        'id' => 'string',
        'annulled'  => 'boolean',
        'annulled_at' => 'datetime',
    ];
    protected $fillable = [
        'enterprise_id',
        'number',
        'route',
        'date_time',
        'agency_origin',
        'agency_dest',
        'sender_id',
        'recipient_id',
        'pkg_total',
        'arancel',
        'ins_pkg',
        'packaging',
        'ship_ins',
        'clearance',
        'trans_dest',
        'transmit',
        'subtotal',
        'vat15',
        'total',
        'pay_method',
        'cash_recv',
        'change',
        'annulled',
        'annulled_by',
        'annulled_at',
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
    public function sender()
    {
        return $this->belongsTo(Sender::class, 'sender_id');
    }

    public function recipient()
    {
        return $this->belongsTo(Recipient::class, 'recipient_id');
    }

    public function packages()
    {
        return $this->hasMany(Package::class, 'reception_id');
    }

    public function additionals()
    {
        return $this->hasMany(Additional::class, 'reception_id');
    }

    public function invoice()
    {
        return $this->hasOne(Invoice::class, 'reception_id');
    }
    public function enterprise()
    {
        return $this->belongsTo(Enterprise::class);
    }
    public function agencyDest()
    {
        return $this->belongsTo(AgencyDest::class, 'agency_dest');
    }
    public function scopeActive($query)
    {
        return $query->where('annulled', false);
    }
}
