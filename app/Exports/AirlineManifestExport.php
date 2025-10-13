<?php

namespace App\Exports;

use App\Models\Reception;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithDrawings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use Carbon\Carbon;
use Illuminate\Support\Str;

class AirlineManifestExport implements FromCollection, WithDrawings, WithStyles
{
    protected $start;
    protected $end;
    protected $enterpriseId;

    public function __construct($start, $end, $enterpriseId)
    {
        $this->start = Carbon::parse($start)->startOfDay();
        $this->end = Carbon::parse($end)->endOfDay();
        $this->enterpriseId = $enterpriseId;
    }

    /**
     * Normaliza cadenas reemplazando ñ/Ñ por n/N
     */
    protected function normalizeString(?string $value): string
    {
        if (!$value) return '';
        $search  = ['ñ', 'Ñ'];
        $replace = ['n', 'N'];
        return str_replace($search, $replace, $value);
    }
    public function collection()
    {
        $rows = [
            ['', '', '', '', 'Cuencanito Express S.A.S.'],
            ['', '', '', '', 'Gran Colombia 3-76 y Vargas Machuca'],
            ['', '', '', '', 'Cuenca - Ecuador'],
            ['', '', '', '', 'Telf: 0993 506593'],
            [],
            ['DATE:', now()->format('d/m/Y')],
            ['MAWB:'],
            ['CARRIER:'],
            ['FLIGHT:'],
            ['AWB:'],
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

        $receptions = Reception::with([
            'sender',
            'recipient',
            'agencyDest',
            'packages.items.artPackage'
        ])
            ->where('enterprise_id', $this->enterpriseId)
            ->where('annulled', false)
            ->whereDate('date_time', '>=', $this->start)
            ->whereDate('date_time', '<=', $this->end)
            ->get();

        foreach ($receptions as $reception) {
            foreach ($reception->packages as $package) {
                $contents = $package->items->map(fn($item) => $this->normalizeString($item->artPackage?->name))->filter()->implode(', ');
                $invoiceCode = Str::before($package->barcode, '.');

                $rows[] = [
                    $invoiceCode,                       // INVOICE
                    $this->normalizeString($reception->sender->full_name ?? ''),     // SHIPPER
                    $this->normalizeString($reception->sender->address ?? ''),       // ADDRESS
                    $this->normalizeString($reception->sender->city ?? ''),          // CITY
                    $this->normalizeString($reception->sender->phone ?? ''),         // TELEPHONE
                    $this->normalizeString($reception->recipient->full_name ?? ''),  // CONSIGNEE
                    $this->normalizeString($reception->recipient->address ?? ''),    // ADDRESS
                    $this->normalizeString($reception->recipient->city ?? ''),       // CITY
                    $this->normalizeString($reception->recipient->postal_code ?? ''), // ZIP
                    $this->normalizeString($reception->recipient->phone ?? ''),      // TELEPHONE
                    $contents,                                // CONTENTS
                    $package->service_type === 'SOBRE' ? 1 : '0',     // ENVELOPE
                    $package->service_type === 'PAQUETE' ? 1 : '0',   // PAQ
                    $package->kilograms,                       // WEIGHT
                    '0',                                         // BAG
                    $this->normalizeString($reception->agencyDest->name ?? ''),     // DESTINATION
                    '',                                        // NOTES
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
        $sheet->mergeCells('A1:C4'); // Ajustar columnas E, F, G para que quepan textos largos 
        $sheet->getColumnDimension('E')->setWidth(12);
        $sheet->getColumnDimension('F')->setWidth(12);
        $sheet->getColumnDimension('G')->setWidth(12); // Fusionar y dar estilo a las filas de la información de la empresa
        foreach (range(1, 4) as $row) {
            $sheet->mergeCells("E{$row}:G{$row}");
            $sheet->getStyle("E{$row}:G{$row}")->applyFromArray(['alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER], 'font' => ['bold' => false, 'italic' => true, 'size' => 11]]);
        }
        // Ajustar valor de MAWB en B6
        $sheet->setCellValue('B6', '729 9102 3376');
        // Ajustar estilo de las etiquetas de DATE, MAWB, CARRIER...
        $sheet->getStyle('A5:A9')->getFont()->setBold(true);
        // ✅ Estilo para las cabeceras en inglés y español 
        $sheet->getStyle('A11:Q12')->applyFromArray(['font' => ['bold' => true, 'size' => 8], 'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],]);

        $sheet->getRowDimension(11);
        $sheet->getRowDimension(12);

        foreach (range('A', 'Q') as $col) {
            if (!in_array($col, ['E', 'F', 'G'])) {
                $sheet->getColumnDimension($col)->setAutoSize(true);
            }
        }
        // Datos paquete: tamaño 5, alineado izquierda
        $highestRow = $sheet->getHighestRow();
        $sheet->getStyle("A13:Q{$highestRow}")->applyFromArray([
            'font' => ['size' => 5],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_LEFT,
                'vertical' => Alignment::VERTICAL_CENTER,
                'wrapText' => true
            ]
        ]);
    }
}
