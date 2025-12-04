<?php

namespace App\Exports;

use App\Models\Reception;
use App\Models\Enterprise;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class IBCManifestExport implements FromCollection, ShouldAutoSize, WithStyles
{
    protected string $startDate;
    protected string $endDate;
    protected string $enterpriseId; // 'all' o id

    public function __construct(string $startDate, string $endDate, string $enterpriseId)
    {
        $this->startDate    = $startDate;
        $this->endDate      = $endDate;
        $this->enterpriseId = $enterpriseId;
    }

    protected function normalizeString(?string $value): string
    {
        if (!$value) return '';
        return str_replace(['ñ', 'Ñ'], ['n', 'N'], $value);
    }

    public function collection(): Collection
    {
        $rows = [];

        // Cabeceras fijas (sin cambios)
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
            'container_id'
        ];

        // Query con soporte 'all' (excluye COAVPRO) y orden igual a Facturación
        $query = Reception::with(['sender', 'recipient', 'agencyDest', 'packages.items.artPackage'])
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

        $receptions = $query->orderBy('enterprise_id')->orderByDesc('date_time')->get();

        foreach ($receptions as $reception) {
            if ($reception->packages->isEmpty()) {
                $rows[] = [
                    'hawb',
                    '14',
                    '',
                    '',
                    '',
                    '',
                    '',
                    'GYE',
                    'USA',
                    '',
                    '',
                    '',
                    '',
                    0,
                    0,
                    'KG',
                    'APX',
                    'USD',
                    0,
                    '',
                    '',
                    '',
                    'O',
                    '',
                    '',
                    '',
                    '6264',
                    '',
                    '',
                    '',
                    $this->normalizeString(mb_substr($reception->sender->full_name ?? '', 0, 30)),
                    $this->normalizeString($reception->sender->address ?? ''),
                    '',
                    $this->normalizeString($reception->sender->city ?? ''),
                    '',
                    $reception->sender->postal_code ?? '',
                    'EC',
                    $reception->sender->phone ?? '',
                    $this->normalizeString(mb_substr($reception->recipient->full_name ?? '', 0, 30)),
                    '',
                    $this->normalizeString($reception->recipient->address ?? ''),
                    '',
                    $this->normalizeString($reception->recipient->city ?? ''),
                    $this->normalizeString($reception->recipient->state ?? ''),
                    $reception->recipient->postal_code ?? '',
                    'US',
                    $reception->recipient->phone ?? '',
                    '',
                    '',
                    '',
                    'EC',
                    '0'
                ];
                continue;
            }

            foreach ($reception->packages as $package) {
                $barcodeBase   = explode('.', $package->barcode ?? '')[0] ?? '';
                $firstHsCode   = $package->items?->first()?->artPackage?->codigo_hs ?? '';
                $description   = $package->items?->map(fn($i) => $this->normalizeString($i->artPackage?->translation ?? ''))->filter()->implode(' ') ?: '';
                $declaredValue = $package->items?->sum(fn($i) => ($i->items_declrd ?? 0) * ($i->decl_val ?? 0)) ?? 0;

                $rows[] = [
                    'hawb',
                    '14',
                    '',
                    $barcodeBase,
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
                    $package->kilograms ?? 0,
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
                    '',
                    '6264',
                    '',
                    '',
                    '',
                    $this->normalizeString(mb_substr($reception->sender->full_name ?? '', 0, 30)),
                    $this->normalizeString($reception->sender->address ?? ''),
                    '',
                    $this->normalizeString($reception->sender->city ?? ''),
                    '',
                    $reception->sender->postal_code ?? '',
                    'EC',
                    $reception->sender->phone ?? '',
                    $this->normalizeString(mb_substr($reception->recipient->full_name ?? '', 0, 30)),
                    '',
                    $this->normalizeString($reception->recipient->address ?? ''),
                    '',
                    $this->normalizeString($reception->recipient->city ?? ''),
                    $this->normalizeString($reception->recipient->state ?? ''),
                    $reception->recipient->postal_code ?? '',
                    'US',
                    $reception->recipient->phone ?? '',
                    '',
                    '',
                    '',
                    'EC',
                    '0'
                ];

                if ($package->items && $package->items->count() > 0) {
                    foreach ($package->items as $item) {
                        $rows[] = [
                            'commodity',
                            '4',
                            $item->items_declrd ?? '',
                            $this->normalizeString($item->artPackage?->translation ?? ''),
                            '',
                            $item->artPackage?->codigo_hs ?? '',
                            'EC',
                            $item->decl_val ?? '',
                            'USD',
                            $item->kilograms ?? '',
                            'K'
                        ];
                    }
                }
            }
        }

        return collect($rows);
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->getStyle($sheet->calculateWorksheetDimension())->applyFromArray([
            'font' => ['name' => 'Arial', 'size' => 10, 'bold' => false],
        ]);
        return [];
    }
}
