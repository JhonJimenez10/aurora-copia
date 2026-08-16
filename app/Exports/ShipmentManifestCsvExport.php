<?php

namespace App\Exports;

use App\Models\Reception;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithCustomCsvSettings;
use Carbon\Carbon;

/**
 * Mismo formato que IBCManifestCsvExport, pero filtrado a UN SOLO embarque:
 * solo salen los paquetes que están dentro de alguna saca de ese embarque.
 */
class ShipmentManifestCsvExport implements FromCollection, WithCustomCsvSettings
{
    protected string $shipmentId;

    private const MAX_LEN = 30;
    private const NOTIFY_EMAIL = 'gerenica@cuencanitoexpress.com';

    private const AIRPORT_CODES = [
        'GUAYAQUIL - JOSE JOAQUIN DE OLMEDO' => 'GYE',
        'QUITO - MARISCAL SUCRE'             => 'UIO',
        "CHICAGO-O'HARE"                     => 'ORD',
        'JOHN F.KENNEDY'                      => 'JFK',
    ];

    public function __construct(string $shipmentId)
    {
        $this->shipmentId = $shipmentId;
    }

    protected function normalizeString(?string $value): string
    {
        if (!$value) return '';
        return str_replace(['ñ', 'Ñ'], ['n', 'N'], $value);
    }

    protected function clip30(?string $value): string
    {
        $t = trim($this->normalizeString($value ?? ''));
        return $t === '' ? '' : mb_substr($t, 0, self::MAX_LEN, 'UTF-8');
    }

    protected function airportCode(?string $name): string
    {
        if (!$name) return '';
        return self::AIRPORT_CODES[$name] ?? $name;
    }

    /** Genera las columnas vacías necesarias para completar la fila hasta 54 columnas */
    private function emptyCols(int $count): array
    {
        return array_fill(0, $count, '');
    }

    public function collection(): Collection
    {
        $shipment = DB::table('shipments')->where('id', $this->shipmentId)->first();

        $rows = $this->headerRows($shipment);

        // Paquetes asignados a alguna saca de ESTE embarque, con su número de saca real.
        $sackNumbersByPackageId = DB::table('shipment_sack_packages')
            ->join('shipment_sacks', 'shipment_sacks.id', '=', 'shipment_sack_packages.shipment_sack_id')
            ->where('shipment_sacks.shipment_id', $this->shipmentId)
            ->pluck('shipment_sacks.sack_number', 'shipment_sack_packages.package_id');

        $packageIds = $sackNumbersByPackageId->keys()->all();

        if (empty($packageIds)) {
            return collect($rows);
        }

        $receptions = Reception::with([
                'sender',
                'recipient',
                'packages' => function ($q) use ($packageIds) {
                    $q->whereIn('id', $packageIds);
                },
                'packages.items.artPackage',
            ])
            ->whereHas('packages', function ($q) use ($packageIds) {
                $q->whereIn('id', $packageIds);
            })
            ->orderByDesc('date_time')
            ->get();

        foreach ($receptions as $reception) {
            foreach ($reception->packages as $package) {
                $barcodeBase = explode('.', (string)($package->barcode ?? ''))[0] ?? '';

                $description = $package->items
                    ->map(fn($item) => $this->normalizeString($item->artPackage?->translation ?? ''))
                    ->filter()
                    ->implode(' ');

                $firstHsCode = $package->items->first()?->artPackage?->codigo_hs ?? '';

                $declaredValue = 0;
                foreach ($package->items as $item) {
                    $declaredValue += (float)(($item->items_declrd ?? 0) * ($item->decl_val ?? 0));
                }

                $containerId = $sackNumbersByPackageId[$package->id] ?? '0';

                // Fila HAWB
                $rows[] = [
                    'hawb','14','',
                    $barcodeBase,
                    '','','',
                    'GYE','USA','','','','',
                    1,
                    $package->kilograms ?? '',
                    'KG','APX','USD',
                    $declaredValue,
                    '',
                    $description,
                    $firstHsCode,
                    '','','O','','',
                    '6264','','','',
                    $this->clip30(optional($reception->sender)->full_name),
                    $this->clip30(optional($reception->sender)->address),
                    '',
                    $this->normalizeString(optional($reception->sender)->city),
                    '',
                    $this->normalizeString(optional($reception->sender)->postal_code),
                    'EC',
                    $this->normalizeString(optional($reception->sender)->phone),
                    $this->clip30(optional($reception->recipient)->full_name),
                    '',
                    $this->clip30(optional($reception->recipient)->address),
                    '',
                    $this->normalizeString(optional($reception->recipient)->city),
                    $this->normalizeString(optional($reception->recipient)->state),
                    $this->normalizeString(optional($reception->recipient)->postal_code),
                    'US',
                    $this->normalizeString(optional($reception->recipient)->phone),
                    '','','',
                    'EC',
                    $containerId,
                ];

                // Filas commodity + FDA
                foreach ($package->items as $item) {
                    $artTranslation = $this->normalizeString($item->artPackage?->translation ?? '');
                    $artHsCode      = $item->artPackage?->codigo_hs ?? '';
                    $artCategoria   = strtoupper(trim($item->artPackage?->categoria ?? ''));
                    $artCodigoFda   = $item->artPackage?->codigo_fda ?? '';

                    $rows[] = array_merge([
                        'commodity','4',
                        $item->items_declrd ?? '',
                        $artTranslation,
                        '',
                        $artHsCode,
                        'EC',
                        $item->decl_val ?? '',
                        'USD',
                        $item->kilograms ?? '',
                        'K',
                    ], $this->emptyCols(43));

                    if (
                        in_array($artCategoria, ['COMIDA', 'COSMETICOS'], true)
                        && $artCodigoFda !== ''
                    ) {
                        $isFood = $artCategoria === 'COMIDA';

                        $type1 = $isFood ? 'FOO' : 'COS';
                        $type2 = $isFood ? 'PRO' : 'COS';
                        $type3 = $isFood ? 'FOO' : 'COS';
                        $extra = $isFood ? '######' : '';

                        $rows[] = array_merge([
                            'fda','1',
                            $artCodigoFda,
                            $type1, $type2, '100', $type3, $extra,
                            $artTranslation,
                        ], $this->emptyCols(45));

                        if ($isFood) {
                            $rows[] = array_merge([
                                'commodity_misc', '1', 'fda_compliance_code',
                                'PNC', 'PRIORI NOTICE',
                            ], $this->emptyCols(48));
                        }
                    }
                }
            }
        }

        return collect($rows);
    }

    protected function headerRows($shipment): array
    {
        $rows = [];
        $rows[] = ['#'];
        $rows[] = ['#'];
        $rows[] = ['email', '1', 'all', self::NOTIFY_EMAIL];

        $mawbNumber = $shipment->number ?? '';
        $dateStr    = ($shipment && $shipment->date)
            ? Carbon::parse($shipment->date)->format('Ymd')
            : now()->format('Ymd');
        $originCode = $this->airportCode($shipment->airport_origin ?? null);
        $destCode   = $this->airportCode($shipment->airport_dest ?? null);
        $flightCode = ''; // no hay campo de número de vuelo en el modelo de embarque

        $rows[] = ['mawb', '1', $mawbNumber, $dateStr, $originCode, $destCode, $flightCode, $mawbNumber];
        $rows[] = ['#'];
        $rows[] = [
            '# record_type','record_version','profile_key','hawb','reference','internal_reference',
            'vend_ref_num','origin','final_destination','outlying','service_provider','dsl_station',
            'dls_final_destination','num_pieces','weight','weight_units','contents','currency_code',
            'declared_value','insurance_amount','description','hs_code','fda_prior_notice','terms',
            'packaging','service_type','collect_amount','cust_key','acct_num','dls_acct_num',
            'ext_cust_acct','shipper_name','shipper_address1','shipper_address2','shipper_city',
            'shipper_state','shipper_zip','shipper_country','shipper_phone','consignee_person',
            'consignee_company','consignee_street_1','consignee_street_2','consignee_city',
            'consignee_state','consignee_postal_code','consignee_country','consignee_phone',
            'consignee_email','consignee_tax_id','comments','goods_country_of_origin','container_id',
        ];

        return $rows;
    }

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