<?php

namespace App\Imports;

use App\Models\Sender;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class SendersImport implements ToModel, WithHeadingRow
{
    private $enterpriseId;

    public function __construct($enterpriseId)
    {
        $this->enterpriseId = $enterpriseId;
    }

    public function model(array $row)
    {
        return new Sender([
            'id'             => Str::uuid(),
            'enterprise_id'  => $this->enterpriseId,
            'country'        => $row['country'],
            'id_type'        => $row['id_type'],
            'identification' => $row['identification'],
            'full_name'      => $row['full_name'],
            'address'        => $row['address'] ?? null,
            'phone'          => $row['phone'] ?? null,
            'whatsapp'       => filter_var($row['whatsapp'], FILTER_VALIDATE_BOOLEAN),
            'email'          => $row['email'] ?? null,
            'postal_code'    => $row['postal_code'] ?? null,
            'city'           => $row['city'] ?? null,
            'canton'         => $row['canton'] ?? null,
            'state'          => $row['state'] ?? null,
            'blocked'        => filter_var($row['blocked'], FILTER_VALIDATE_BOOLEAN),
            'alert'          => filter_var($row['alert'], FILTER_VALIDATE_BOOLEAN),
        ]);
    }
}
