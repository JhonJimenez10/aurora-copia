<?php

namespace App\Exports;

use App\Models\Reception;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithDrawings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

/**
 * Mismo formato que AirlineManifestExport (el reporte con columna BAG /
 * SACA), pero filtrado a UN SOLO embarque: solo salen los paquetes que
 * están dentro de alguna saca de ese embarque, y la columna BAG muestra
 * el número REAL de saca asignado en el embarque (antes salía siempre 0).
 */
class ShipmentAirlineManifestExport implements FromCollection, WithDrawings, WithStyles
{
    protected string $shipmentId;

    private const MAX_LEN = 30;

    public function __construct(string $shipmentId)
    {
        $this->shipmentId = $shipmentId;
    }

    /** Reemplaza ñ/Ñ por n/N */
    protected function normalizeString(?string $value): string
    {
        if (!$value) return '';
        return str_replace(['ñ', 'Ñ'], ['n', 'N'], $value);
    }

    /** Normaliza y recorta a 30 caracteres (UTF-8 seguro) */
    protected function clip30(?string $value): string
    {
        $t = trim($this->normalizeString($value ?? ''));
        return $t === '' ? '' : mb_substr($t, 0, self::MAX_LEN, 'UTF-8');
    }

    public function collection(): Collection
    {
        $shipment = DB::table('shipments')->where('id', $this->shipmentId)->first();

        $rows = [
            ['', '', '', '', 'Cuencanito Express S.A.S.'],
            ['', '', '', '', 'Gran Colombia 3-76 y Vargas Machuca'],
            ['', '', '', '', 'Cuenca - Ecuador'],
            ['', '', '', '', 'Telf: 0993 506593'],
            [],
            ['DATE:', ($shipment && $shipment->date)
                ? Carbon::parse($shipment->date)->format('d/m/Y')
                : now()->format('d/m/Y')],
            ['MAWB:', $shipment->number ?? ''],
            ['CARRIER:', $shipment->airline ?? ''],
            ['FLIGHT:'],
            ['AWB:', $shipment->number ?? ''],
            [''],
            [
                'INVOICE',
                'SHIPPER',
                'ADDRESS',
                'CITY',
                'TELEPHONE',
                'CONSIGNEE',
                'ADDRESS',
                'CITY',
                'ZIP',
                'TELEPHONE',
                'CONTENTS',
                'ENVELOPE',
                'PAQ',
                'WEIGHT',
                'BAG',
                'DESTINATION',
                'NOTES'
            ],
            [
                'FACTURA',
                'EMBARCADOR',
                'DIRECCION',
                'CIUDAD',
                'TELEFONO',
                'CONSIGNATARIO',
                'DIRECCION',
                'CIUDAD',
                'CODIGO POSTAL',
                'TELEFONO',
                'CONTENIDO',
                'SOB',
                'PAQ',
                'PESO',
                'SACA',
                'AG. DESTINO',
                'OBSERVACIONES'
            ],
        ];

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
                'agencyDest',
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
                $contents    = $package->items
                    ->map(fn($i) => $this->normalizeString($i->artPackage?->name))
                    ->filter()
                    ->implode(', ');
                $invoiceCode = Str::before((string) ($package->barcode ?? ''), '.');

                // ✅ NUEVO: número real de saca del embarque (antes 0 fijo).
                $bagNumber = $sackNumbersByPackageId[$package->id] ?? '0';

                $rows[] = [
                    $invoiceCode,                                         // INVOICE
                    $this->clip30($reception->sender->full_name ?? ''),  // SHIPPER (<=30)
                    $this->clip30($reception->sender->address ?? ''),    // ADDRESS SHIPPER (<=30)
                    $this->normalizeString($reception->sender->city ?? ''),
                    $this->normalizeString($reception->sender->phone ?? ''),
                    $this->clip30($reception->recipient->full_name ?? ''), // CONSIGNEE (<=30)
                    $this->clip30($reception->recipient->address ?? ''),   // ADDRESS CONSIGNEE (<=30)
                    $this->normalizeString($reception->recipient->city ?? ''),
                    $this->normalizeString($reception->recipient->postal_code ?? ''),
                    $this->normalizeString($reception->recipient->phone ?? ''),
                    $contents,
                    $package->service_type === 'SOBRE'   ? 1 : 0,
                    $package->service_type === 'PAQUETE' ? 1 : 0,
                    $package->kilograms ?? 0,
                    $bagNumber,
                    $this->normalizeString($reception->agencyDest->name ?? ''),
                    '',
                ];
            }
        }

        return collect($rows);
    }

    public function drawings()
    {
        $drawing = new Drawing();
        $drawing->setName('Logo');
        $drawing->setDescription('Logo Empresa');
        $drawing->setPath(public_path('images/logo-cuencanito.jpg'));
        $drawing->setHeight(75);
        $drawing->setCoordinates('A1');
        $drawing->setOffsetX(0);
        $drawing->setOffsetY(0);
        return $drawing;
    }

    public function styles(Worksheet $sheet)
    {
        // Bloque de cabecera (logo + datos)
        $sheet->mergeCells('A1:C4');

        $sheet->getColumnDimension('E')->setWidth(12);
        $sheet->getColumnDimension('F')->setWidth(12);
        $sheet->getColumnDimension('G')->setWidth(12);

        foreach (range(1, 4) as $row) {
            $sheet->mergeCells("E{$row}:G{$row}");
            $sheet->getStyle("E{$row}:G{$row}")->applyFromArray([
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'vertical'   => Alignment::VERTICAL_CENTER
                ],
                'font' => ['bold' => false, 'italic' => true, 'size' => 11]
            ]);
        }

        // Etiquetas DATE/MAWB/CARRIER/FLIGHT/AWB en negrita (filas 6 a 10)
        $sheet->getStyle('A6:A10')->getFont()->setBold(true);

        // Cabeceras (filas 12 y 13)
        $sheet->getStyle('A12:Q13')->applyFromArray([
            'font' => ['bold' => true, 'size' => 8],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical'   => Alignment::VERTICAL_CENTER,
                'wrapText'   => true
            ],
        ]);

        foreach (range('A', 'Q') as $col) {
            if (!in_array($col, ['E', 'F', 'G'])) {
                $sheet->getColumnDimension($col)->setAutoSize(true);
            }
        }

        // Detalle (desde la fila 14)
        $highestRow = $sheet->getHighestRow();
        if ($highestRow >= 14) {
            $sheet->getStyle("A14:Q{$highestRow}")->applyFromArray([
                'font' => ['size' => 8],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_LEFT,
                    'vertical'   => Alignment::VERTICAL_CENTER,
                    'wrapText'   => true
                ]
            ]);
        }

        return [];
    }
}