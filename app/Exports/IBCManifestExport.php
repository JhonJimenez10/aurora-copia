<?php

namespace App\Exports;

use App\Models\Reception;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class IBCManifestExport implements FromCollection, ShouldAutoSize, WithStyles
{
    protected string $startDate;
    protected string $endDate;
    protected string $enterpriseId;

    public function __construct(string $startDate, string $endDate, string $enterpriseId)
    {
        $this->startDate    = $startDate;
        $this->endDate      = $endDate;
        $this->enterpriseId = $enterpriseId;
    }

    public function collection(): Collection
    {
        $rows = [];

        // 🔹 Cabeceras iniciales
        $rows[] = ['#'];
        $rows[] = ['#'];
        $rows[] = ['email', '1', 'all', 'gerenica@cuencanitoexpress.com'];
        $rows[] = ['mawb', '1', '72991023376', now()->format('Ymd'), 'GYE', 'JFK', 'AV7394', '72991023376'];
        $rows[] = ['#'];
        $rows[] = [
            '# record_type',
            'record_version',
            'profile_key',
            'hawb',
            'reference',
            'internal_reference',
            'vend_ref_num',
            'origin',
            'final_destination',
            'outlying',
            'service_provider',
            'dsl_station',
            'dls_final_destination',
            'num_pieces',
            'weight',
            'weight_units',
            'contents',
            'currency_code',
            'declared_value',
            'insurance_amount',
            'description',
            'hs_code',
            'fda_prior_notice',
            'terms',
            'packaging',
            'service_type',
            'collect_amount',
            'cust_key',
            'acct_num',
            'dls_acct_num',
            'ext_cust_acct',
            'shipper_name',
            'shipper_address1',
            'shipper_address2',
            'shipper_city',
            'shipper_state',
            'shipper_zip',
            'shipper_country',
            'shipper_phone',
            'consignee_person',
            'consignee_company',
            'consignee_street_1',
            'consignee_street_2',
            'consignee_city',
            'consignee_state',
            'consignee_postal_code',
            'consignee_country',
            'consignee_phone',
            'consignee_email',
            'consignee_tax_id',
            'comments',
            'goods_country_of_origin',
            'container_id',
        ];

        $receptions = Reception::with([
            'sender',
            'recipient',
            'agencyDest',
            'packages.items.artPackage',
        ])
            ->where('enterprise_id', $this->enterpriseId)
            ->whereBetween('date_time', [$this->startDate, $this->endDate])
            ->where('annulled', false)
            ->get();

        foreach ($receptions as $reception) {
            foreach ($reception->packages as $package) {
                $barcodeBase = explode('.', $package->barcode)[0] ?? $package->barcode;

                // ✅ Concatenar descripción de los artículos
                $description = $package->items->map(function ($item) {
                    return $item->artPackage?->translation ?? '';
                })->filter()->implode(' ');
                // Obtener primer codigo_hs para hs_code en hawb
                $firstHsCode = $package->items->first()?->artPackage?->codigo_hs ?? '';
                // 🔹 Calcular declared_value para la fila HAWB
                $declaredValue = 0;
                foreach ($package->items as $item) {
                    $declaredValue += ($item->items_declrd ?? 0) * ($item->decl_val ?? 0);
                }
                // ✅ Fila HAWB
                $rows[] = [
                    'hawb',
                    '14',
                    '',                              // profile_key
                    $barcodeBase,                    // hawb
                    '',                              // reference
                    '',                              // internal_reference
                    '',                              // vend_ref_num
                    'GYE',                           // origin
                    'USA',                           // final_destination
                    '',
                    '',
                    '',
                    '',                  // outlying, service_provider, dsl_station, dls_final_destination
                    1,                               // num_pieces
                    $package->kilograms ?? '',       // weight
                    'KG',                            // weight_units
                    'APX',                           // contents
                    'USD',                           // currency_code
                    $declaredValue,       // declared_value
                    '',                              // insurance_amount
                    $description,                    // description
                    $firstHsCode,                               // hs_code
                    '',                              // fda_prior_notice
                    '',                              // terms
                    'O',                             // packaging (por defecto)
                    '',                              // service_type
                    '',                              // collect_amount
                    '',                              // cust_key
                    '6264',                          // acct_num
                    '',                              // dls_acct_num
                    '',                              // ext_cust_acct
                    // 🔹 shipper_name → recortar a 30 caracteres
                    mb_substr($reception->sender->full_name ?? '', 0, 30),
                    $reception->sender->address ?? '',
                    '',
                    $reception->sender->city ?? '',
                    '',
                    $reception->sender->postal_code ?? '',
                    'EC',                            // shipper_country
                    $reception->sender->phone ?? '',
                    // 🔹 consignee_person → recortar a 30 caracteres
                    mb_substr($reception->recipient->full_name ?? '', 0, 30),
                    '',
                    $reception->recipient->address ?? '',
                    '',
                    $reception->recipient->city ?? '',
                    $reception->recipient->state ?? '',
                    $reception->recipient->postal_code ?? '',
                    'US',                            // consignee_country
                    $reception->recipient->phone ?? '',
                    '',
                    '',
                    '',
                    'EC',                            // goods_country_of_origin
                    '0',
                ];

                // ✅ SOLO desglosar si hay más de un item
                if ($package->items->count() > 1) {
                    foreach ($package->items as $item) {
                        $rows[] = [
                            'commodity',
                            '4',
                            $item->items_declrd ?? '',
                            $item->artPackage?->translation ?? '',
                            '',
                            $item->artPackage?->codigo_hs ?? '',
                            'EC',
                            $item->decl_val ?? '',
                            'USD',
                            $item->kilograms ?? '',
                            'K',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                        ];
                    }
                }
            }
        }

        return collect($rows);
    }

    public function styles(Worksheet $sheet)
    {
        // Aplicar estilo general a toda la hoja
        $sheet->getStyle($sheet->calculateWorksheetDimension())->applyFromArray([
            'font' => [
                'name' => 'Arial',
                'size' => 10,
                'bold' => false,
            ],
        ]);

        return [];
    }
}
