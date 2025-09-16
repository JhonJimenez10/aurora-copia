<?php

namespace App\Exports;

use App\Models\Reception;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithCustomCsvSettings;

class IBCManifestCsvExport implements FromCollection, WithCustomCsvSettings
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

        // 🔹 Cabeceras idénticas a Excel
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

        $receptions = Reception::with(['sender', 'recipient', 'packages.items.artPackage'])
            ->where('enterprise_id', $this->enterpriseId)
            ->whereBetween('date_time', [$this->startDate, $this->endDate])
            ->where('annulled', false)
            ->get();

        foreach ($receptions as $reception) {
            foreach ($reception->packages as $package) {
                $barcodeBase = explode('.', $package->barcode)[0] ?? $package->barcode;

                $description = $package->items->map(fn($item) => $item->artPackage?->translation ?? '')
                    ->filter()->implode(' ');

                // ✅ Fila HAWB
                $rows[] = [
                    'hawb',
                    '14',
                    '',
                    '' . $barcodeBase,
                    '',
                    '',
                    '',
                    'GYE',
                    'USA',
                    '',
                    '',
                    '',
                    '',
                    1,
                    $package->kilograms ?? '',
                    'KG',
                    'APX',
                    'USD',
                    $package->decl_val ?? '',
                    '',
                    '' . $description,
                    '',
                    '',
                    '',
                    'O',
                    '',
                    '',
                    '6264',
                    '',
                    '',
                    mb_substr($reception->sender->full_name ?? '', 0, 30),
                    $reception->sender->address ?? '',
                    '',
                    $reception->sender->city ?? '',
                    '',
                    '' . $reception->sender->postal_code ?? '',
                    'EC',
                    $reception->sender->phone ?? '',
                    mb_substr($reception->recipient->full_name ?? '', 0, 30),
                    '',
                    $reception->recipient->address ?? '',
                    '',
                    $reception->recipient->city ?? '',
                    $reception->recipient->state ?? '',
                    '' . $reception->recipient->postal_code ?? '',
                    'US',
                    $reception->recipient->phone ?? '',
                    '',
                    '',
                    'EC',
                    ''
                ];

                // ✅ Fila commodity si hay más de 1 item
                if ($package->items->count() > 1) {
                    foreach ($package->items as $item) {
                        $rows[] = [
                            'commodity',
                            '4',
                            $item->items_declrd ?? '',
                            $item->artPackage?->translation ?? '',
                            '',
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
                            ''
                        ];
                    }
                }
            }
        }

        return collect($rows);
    }

    /**
     * Configuración CSV para quitar comillas
     */
    public function getCsvSettings(): array
    {
        return [
            'delimiter' => ',',
            'enclosure' => '',  // ❌ Sin comillas
            'line_ending' => PHP_EOL,
            'use_bom' => true,  // Para Excel UTF-8
        ];
    }
}
