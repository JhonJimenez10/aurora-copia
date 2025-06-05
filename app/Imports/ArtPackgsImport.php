<?php

namespace App\Imports;

use App\Models\ArtPackg;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class ArtPackgsImport implements ToModel, WithHeadingRow
{
    private $enterpriseId;

    public function __construct($enterpriseId)
    {
        $this->enterpriseId = $enterpriseId;
    }

    public function model(array $row)
    {
        return new ArtPackg([
            'id'             => Str::uuid(),
            'enterprise_id'  => $this->enterpriseId,
            'name'           => $row['name'],
            'unit_type'      => $row['unit_type'] ?? null,
            'unit_price'     => $row['unit_price'],
            'canceled'       => filter_var($row['canceled'], FILTER_VALIDATE_BOOLEAN),
        ]);
    }
}
