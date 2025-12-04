<?php

namespace App\Exports;

use App\Models\Reception;
use App\Models\Enterprise;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithDrawings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

class AirlineManifestExport implements FromCollection, WithDrawings, WithStyles
{
    protected Carbon $start;
    protected Carbon $end;
    protected string $enterpriseId; // puede ser 'all' o un id

    private const MAX_LEN = 30;

    public function __construct($start, $end, $enterpriseId)
    {
        $this->start        = Carbon::parse($start)->startOfDay();
        $this->end          = Carbon::parse($end)->endOfDay();
        $this->enterpriseId = (string) $enterpriseId;
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

        // Query base
        $query = Reception::with(['sender', 'recipient', 'agencyDest', 'packages.items.artPackage'])
            ->where('annulled', false)
            ->whereBetween('date_time', [$this->start, $this->end]);

        // Filtro por empresa con soporte 'all' (excluye COAVPRO)
        if ($this->enterpriseId !== 'all') {
            $query->where('enterprise_id', $this->enterpriseId);
        } else {
            $coavproIds = Enterprise::where('commercial_name', 'COAVPRO')->pluck('id')->toArray();
            if (!empty($coavproIds)) {
                $query->whereNotIn('enterprise_id', $coavproIds);
            }
        }

        // Orden como en otros reportes
        $receptions = $query->orderBy('enterprise_id')->orderByDesc('date_time')->get();

        foreach ($receptions as $reception) {
            foreach ($reception->packages as $package) {
                $contents    = $package->items
                    ->map(fn($i) => $this->normalizeString($i->artPackage?->name))
                    ->filter()
                    ->implode(', ');
                $invoiceCode = Str::before((string) ($package->barcode ?? ''), '.');

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
                    0,
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

        // MAWB ejemplo
        $sheet->setCellValue('B6', '729 9102 3376');

        // Estilos de etiquetas
        $sheet->getStyle('A5:A9')->getFont()->setBold(true);

        // Cabeceras
        $sheet->getStyle('A11:Q12')->applyFromArray([
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

        // Detalle
        $highestRow = $sheet->getHighestRow();
        if ($highestRow >= 13) {
            $sheet->getStyle("A13:Q{$highestRow}")->applyFromArray([
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
