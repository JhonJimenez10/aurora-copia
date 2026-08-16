<?php

namespace App\Exports;

use App\Models\Reception;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Carbon\Carbon;

/**
 * Manifiesto de exportación (mismo formato que IBCManifestExport) pero
 * filtrado a UN SOLO embarque: solo salen los paquetes que están dentro
 * de alguna saca de ese embarque (shipment_id).
 */
class ShipmentManifestExport implements FromCollection, ShouldAutoSize, WithStyles
{
    protected string $shipmentId;

    private const MAX_LEN = 30;

    // Email fijo de la empresa (igual que IBCManifestExport)
    private const NOTIFY_EMAIL = 'gerenica@cuencanitoexpress.com';

    // Código IATA por nombre de aeropuerto (según AIRPORT_ORIGIN_OPTIONS /
    // AIRPORT_DEST_OPTIONS del frontend). Ajusta si falta alguno.
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

    public function collection(): Collection
    {
        $rows = [];

        $shipment = DB::table('shipments')->where('id', $this->shipmentId)->first();

        if (!$shipment) {
            // Embarque inexistente: devolvemos solo cabeceras, sin data.
            return collect($this->headerRows(null));
        }

        // Cabeceras fijas + mawb con datos reales del embarque
        $rows = $this->headerRows($shipment);

        // Paquetes asignados a alguna saca de ESTE embarque, con su número de saca real.
        $sackNumbersByPackageId = DB::table('shipment_sack_packages')
            ->join('shipment_sacks', 'shipment_sacks.id', '=', 'shipment_sack_packages.shipment_sack_id')
            ->where('shipment_sacks.shipment_id', $this->shipmentId)
            ->pluck('shipment_sacks.sack_number', 'shipment_sack_packages.package_id');

        $packageIds = $sackNumbersByPackageId->keys()->all();

        if (empty($packageIds)) {
            // Embarque sin sacas/paquetes todavía: solo cabeceras.
            return collect($rows);
        }

        // Solo recepciones que tengan al menos un paquete de este embarque,
        // y dentro de cada una, solo esos paquetes (no los demás de la recepción).
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
            $sender    = $reception->sender;
            $recipient = $reception->recipient;

            // Con packages ya filtrados solo a los de este embarque.
            foreach ($reception->packages as $package) {
                $barcodeBase   = explode('.', $package->barcode ?? '')[0] ?? '';
                $firstHsCode   = $package->items?->first()?->artPackage?->codigo_hs ?? '';
                $description   = $package->items?->map(fn($i) => $this->normalizeString($i->artPackage?->translation ?? ''))->filter()->implode(' ') ?: '';
                $declaredValue = $package->items?->sum(fn($i) => ($i->items_declrd ?? 0) * ($i->decl_val ?? 0)) ?? 0;

                // Número real de saca DE ESTE EMBARQUE (ya viene garantizado
                // porque solo trajimos paquetes que están en una saca del mismo).
                $containerId = $sackNumbersByPackageId[$package->id] ?? '0';

                $rows[] = [
                    'hawb','14','',
                    $barcodeBase,
                    '','','',
                    'GYE','USA','','','','',
                    1,
                    $package->kilograms ?? 0,
                    'KG','APX','USD',
                    $declaredValue,
                    '',
                    $description,
                    $firstHsCode,
                    '','','O','','',
                    '6264','','','',
                    $this->clip30(optional($sender)->full_name),
                    $this->clip30(optional($sender)->address),
                    '',
                    $this->normalizeString(optional($sender)->city),
                    '',
                    $this->normalizeString(optional($sender)->postal_code),
                    'EC',
                    $this->normalizeString(optional($sender)->phone),
                    $this->clip30(optional($recipient)->full_name),
                    '',
                    $this->clip30(optional($recipient)->address),
                    '',
                    $this->normalizeString(optional($recipient)->city),
                    $this->normalizeString(optional($recipient)->state),
                    $this->normalizeString(optional($recipient)->postal_code),
                    'US',
                    $this->normalizeString(optional($recipient)->phone),
                    '','','',
                    'EC',
                    $containerId,
                ];

                // Filas commodity + FDA (idéntico a IBCManifestExport)
                if ($package->items && $package->items->count() > 0) {
                    foreach ($package->items as $item) {
                        $artTranslation = $this->normalizeString($item->artPackage?->translation ?? '');
                        $artHsCode      = $item->artPackage?->codigo_hs ?? '';
                        $artCategoria   = strtoupper(trim($item->artPackage?->categoria ?? ''));
                        $artCodigoFda   = $item->artPackage?->codigo_fda ?? '';

                        $rows[] = [
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
                        ];

                        if (
                            in_array($artCategoria, ['COMIDA', 'COSMETICOS'], true)
                            && $artCodigoFda !== ''
                        ) {
                            $isFood = $artCategoria === 'COMIDA';

                            $type1 = $isFood ? 'FOO' : 'COS';
                            $type2 = $isFood ? 'PRO' : 'COS';
                            $type3 = $isFood ? 'FOO' : 'COS';
                            $extra = $isFood ? '######' : '';

                            $rows[] = [
                                'fda','1',
                                $artCodigoFda,
                                $type1, $type2, '100', $type3, $extra,
                                $artTranslation,
                            ];

                            if ($isFood) {
                                $rows[] = [
                                    'commodity_misc', '1', 'fda_compliance_code',
                                    'PNC', 'PRIORI NOTICE',
                                ];
                            }
                        }
                    }
                }
            }
        }

        return collect($rows);
    }

    /**
     * Cabeceras fijas + la fila 'mawb' con datos reales del embarque
     * (número de guía madre, fecha, aeropuertos). Si $shipment es null
     * (embarque no encontrado), usa valores por defecto.
     */
    protected function headerRows($shipment): array
    {
        $rows = [];
        $rows[] = ['#'];
        $rows[] = ['#'];
        $rows[] = ['email', '1', 'all', self::NOTIFY_EMAIL];

        $mawbNumber  = $shipment->number ?? '';
        $dateStr     = ($shipment && $shipment->date)
            ? Carbon::parse($shipment->date)->format('Ymd')
            : now()->format('Ymd');
        $originCode  = $this->airportCode($shipment->airport_origin ?? null);
        $destCode    = $this->airportCode($shipment->airport_dest ?? null);
        // No hay campo de "número de vuelo" en el modelo de embarque;
        // se deja vacío hasta que se agregue esa información.
        $flightCode  = '';

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

    public function styles(Worksheet $sheet)
    {
        $sheet->getStyle($sheet->calculateWorksheetDimension())->applyFromArray([
            'font' => ['name' => 'Arial', 'size' => 10, 'bold' => false],
        ]);
        return [];
    }
}