<?php

namespace App\Imports;

use App\Models\ArtPackage;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class ArtPackagesImport implements ToModel, WithHeadingRow
{
    private $enterpriseId;

    public function __construct($enterpriseId)
    {
        $this->enterpriseId = $enterpriseId;
    }

    public function model(array $row)
    {
        return new ArtPackage([
            'id'             => Str::uuid(),
            'enterprise_id'  => $this->enterpriseId,
            'name'           => $row['name'],
            'translation'    => $row['translation'] ?? null,
            'codigo_hs'      => $row['codigo_hs'] ?? null,
            'unit_type'      => $row['unit_type'] ?? null,
            'unit_price'     => $row['unit_price'],
            'agent_val'      => $row['agent_val'],
            'canceled'       => filter_var($row['canceled'], FILTER_VALIDATE_BOOLEAN),
        ]);
    }
}
