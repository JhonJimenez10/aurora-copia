<?php

namespace App\Exports;

use App\Models\Reception;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Illuminate\Support\Str;

class ACASAviancaManifestExport implements FromCollection, WithMapping, WithHeadings, WithStyles
{
    protected $startDate;
    protected $endDate;
    protected $enterpriseId;

    protected $groupedData;

    public function __construct($startDate, $endDate, $enterpriseId)
    {
        $this->startDate = $startDate;
        $this->endDate = $endDate;
        $this->enterpriseId = $enterpriseId;
    }

    public function collection()
    {
        $query = Reception::with(['sender', 'recipient', 'packages.items.artPackage'])
            ->whereDate('date_time', '>=', $this->startDate)
            ->whereDate('date_time', '<=', $this->endDate);

        if (!empty($this->enterpriseId) && $this->enterpriseId !== 'null') {
            $query->where('enterprise_id', $this->enterpriseId);
        }

        $receptions = $query->get();

        $grouped = []; // ❌ Usamos array normal para evitar error de Collection

        foreach ($receptions as $reception) {
            foreach ($reception->packages as $package) {

                // ✅ Código base antes del punto
                $baseCode = Str::before($package->barcode, '.');

                // Inicializar si no existe
                if (!isset($grouped[$baseCode])) {
                    $grouped[$baseCode] = [
                        'hawb'      => $baseCode,
                        'sender'    => $reception->sender,
                        'recipient' => $reception->recipient,
                        'pieces'    => 0,
                        'weight'    => 0,
                        'contents'  => [],
                    ];
                }

                // Actualizar valores
                $grouped[$baseCode]['pieces']  += 1;
                $grouped[$baseCode]['weight']  += $package->kilograms;

                $description = $package->items
                    ->map(fn($item) => $item->artPackage?->name)
                    ->filter()
                    ->implode(' ');

                if (!empty($description)) {
                    $grouped[$baseCode]['contents'][] = $description;
                }
            }
        }

        // Convertimos a Collection solo al final
        $this->groupedData = collect(array_values($grouped));

        return $this->groupedData;
    }

    public function map($row): array
    {
        return [
            $row['hawb'],                     // HAWB (sin .1, .2)
            'GYE',                             // Origen
            'JFK',                             // DESTINO
            $row['pieces'],                    // PIEZAS
            $row['weight'],                    // PESO
            $row['sender']->full_name ?? '',   // NOMBRE DEL SHP
            $row['sender']->address ?? '',     // DIRECCION 1 SHP
            $row['sender']->city ?? '',        // CIUDAD SHP
            'EC',                              // ESTADO REGION SHP
            'EC',                              // PAIS SHP
            $row['sender']->postal_code ?? '', // CODIGO POSTAL SHP
            $row['recipient']->full_name ?? '', // NOMBRE DEL CNE
            $row['recipient']->address ?? '',   // DIRECCION 1 CNE
            $row['recipient']->city ?? '',      // CIUDAD CNE
            $row['recipient']->state ?? '',     // ESTADO REGION CNE
            'US',                               // PAIS CNE
            $row['recipient']->postal_code ?? '', // CODIGO POSTAL CNE
            implode(', ', $row['contents']),      // DESCRIPCIÓN DE LA CARGA
        ];
    }

    public function headings(): array
    {
        return [
            'HAWB',
            'Origen',
            'DESTINO',
            'PIEZAS',
            'PESO',
            'NOMBRE DEL SHP',
            'DIRECCION 1 SHP',
            'CIUDAD SHP',
            'ESTADO REGION',
            'PAIS',
            'CODIGO POSTAL',
            'NOMBRE DEL CNE',
            'DIRECCION 1 CNE',
            'CIUDAD CNE',
            'ESTADO REGION CNE',
            'PAIS CNE',
            'CODIGO POSTAL CNE',
            'DESCRIPCION DE LA CARGA',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->getStyle('1:1')->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['argb' => 'FFFFFFFF'],
            ],
            'alignment' => [
                'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
                'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER,
            ],
            'fill' => [
                'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                'startColor' => [
                    'argb' => 'FF17365D',
                ],
            ],
        ]);

        $highestColumn = $sheet->getHighestColumn();
        foreach (range('A', $highestColumn) as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }
    }
}
