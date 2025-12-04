<?php

namespace App\Exports;

use App\Models\Reception;
use App\Models\Enterprise;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithCustomCsvSettings;

class IBCManifestCsvExport implements FromCollection, WithCustomCsvSettings
{
    protected string $startDate;
    protected string $endDate;
    protected string $enterpriseId;

    private const MAX_LEN = 30;

    public function __construct(string $startDate, string $endDate, string $enterpriseId)
    {
        $this->startDate    = $startDate;
        $this->endDate      = $endDate;
        $this->enterpriseId = $enterpriseId;
    }

    /**
     * Normaliza cadenas reemplazando ñ/Ñ por n/N
     */
    protected function normalizeString(?string $value): string
    {
        if (!$value) return '';
        return str_replace(['ñ', 'Ñ'], ['n', 'N'], $value);
    }

    /**
     * Normaliza + recorta a 30 caracteres de forma segura (UTF-8)
     */
    protected function clip30(?string $value): string
    {
        $t = trim($this->normalizeString($value ?? ''));
        return $t === '' ? '' : mb_substr($t, 0, self::MAX_LEN, 'UTF-8');
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

        // 🔹 Query con soporte 'all' (excluye COAVPRO) y ordenado por empresa + fecha desc
        $query = Reception::with(['sender', 'recipient', 'packages.items.artPackage'])
            ->whereBetween('date_time', [$this->startDate, $this->endDate])
            ->where('annulled', false);

        if ($this->enterpriseId !== 'all') {
            $query->where('enterprise_id', $this->enterpriseId);
        } else {
            $coavproIds = Enterprise::where('commercial_name', 'COAVPRO')->pluck('id')->toArray();
            if (!empty($coavproIds)) {
                $query->whereNotIn('enterprise_id', $coavproIds);
            }
        }

        $receptions = $query
            ->orderBy('enterprise_id')
            ->orderByDesc('date_time')
            ->get();

        foreach ($receptions as $reception) {
            foreach ($reception->packages as $package) {
                $barcodeBase = explode('.', (string)($package->barcode ?? ''))[0] ?? '';

                // Concatenar descripción de los artículos
                $description = $package->items
                    ->map(fn($item) => $this->normalizeString($item->artPackage?->translation ?? ''))
                    ->filter()
                    ->implode(' ');

                // Primer codigo_hs para hs_code en HAWB
                $firstHsCode = $package->items->first()?->artPackage?->codigo_hs ?? '';

                // 🔹 Calcular declared_value sumando items_declrd * decl_val
                $declaredValue = 0;
                foreach ($package->items as $item) {
                    $declaredValue += (float) (($item->items_declrd ?? 0) * ($item->decl_val ?? 0));
                }

                // ✅ Fila HAWB (con recorte de 30 chars en nombres y direcciones)
                $rows[] = [
                    'hawb',
                    '14',
                    '',
                    $barcodeBase,
                    '',
                    '', // internal_reference vacío en HAWB
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
                    $declaredValue,
                    '',
                    $description,
                    $firstHsCode,
                    '',
                    '',
                    'O',
                    '',
                    '',
                    '6264',
                    '',
                    '',
                    $this->clip30(optional($reception->sender)->full_name),   // <= 30
                    $this->clip30(optional($reception->sender)->address),     // <= 30
                    '',
                    $this->normalizeString(optional($reception->sender)->city),
                    '',
                    $this->normalizeString(optional($reception->sender)->postal_code),
                    'EC',
                    $this->normalizeString(optional($reception->sender)->phone),
                    $this->clip30(optional($reception->recipient)->full_name), // <= 30
                    '',
                    $this->clip30(optional($reception->recipient)->address),   // <= 30
                    '',
                    $this->normalizeString(optional($reception->recipient)->city),
                    $this->normalizeString(optional($reception->recipient)->state),
                    $this->normalizeString(optional($reception->recipient)->postal_code),
                    'US',
                    $this->normalizeString(optional($reception->recipient)->phone),
                    '',
                    '',
                    '',
                    'EC',
                    '',
                ];

                // ✅ Filas commodity (solo datos propios, resto vacío)
                foreach ($package->items as $item) {
                    $rows[] = [
                        'commodity',
                        '4',
                        $item->items_declrd ?? '',
                        $this->normalizeString($item->artPackage?->translation ?? ''),
                        '',
                        $item->artPackage?->codigo_hs ?? '', // internal_reference
                        'EC',
                        $item->decl_val ?? '',
                        'USD',
                        $item->kilograms ?? '',
                        'K',
                        // columnas restantes vacías
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

        return collect($rows);
    }

    /**
     * Configuración CSV (sin comillas)
     */
    public function getCsvSettings(): array
    {
        return [
            'delimiter'   => ',',
            'enclosure'   => '',
            'line_ending' => PHP_EOL,
            'use_bom'     => true,
        ];
    }
}
