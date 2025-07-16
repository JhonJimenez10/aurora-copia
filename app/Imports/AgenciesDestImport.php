<?php

namespace App\Imports;

use App\Models\AgencyDest;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class AgenciesDestImport implements ToModel, WithHeadingRow
{
    private $enterpriseId;

    public function __construct($enterpriseId)
    {
        $this->enterpriseId = $enterpriseId;
    }

    public function model(array $row)
    {
        return new AgencyDest([
            'id'            => Str::uuid(),
            'enterprise_id' => $this->enterpriseId,
            'name'          => $row['name'],
            'code_letters'  => $row['code_letters'],
            'trade_name'    => $row['trade_name'] ?? null,
            'address'       => $row['address'] ?? null,
            'phone'         => $row['phone'] ?? null,
            'postal_code'   => $row['postal_code'] ?? null,
            'city'          => $row['city'] ?? null,
            'state'         => $row['state'] ?? null,
            'available_us'  => filter_var($row['available_us'], FILTER_VALIDATE_BOOLEAN),
            'value'         => isset($row['value']) && is_numeric($row['value']) && $row['value'] >= 0 ? (float) $row['value'] : 0,

        ]);
    }
}
