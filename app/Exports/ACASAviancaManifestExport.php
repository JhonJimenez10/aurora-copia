<?php

namespace App\Exports;

use App\Models\Reception;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Maatwebsite\Excel\Concerns\WithStyles; // ✅ Importar

class ACASAviancaManifestExport implements FromCollection, WithMapping, WithHeadings, WithStyles
{
    protected $startDate;
    protected $endDate;
    protected $enterpriseId;

    public function __construct($startDate, $endDate, $enterpriseId)
    {
        $this->startDate = $startDate;
        $this->endDate = $endDate;
        $this->enterpriseId = $enterpriseId;
    }

    /**
     * Obtener todos los paquetes filtrando por empresa y fechas
     */
    public function collection()
    {
        $query = Reception::with(['sender', 'recipient', 'packages.items.artPackage'])
            ->whereDate('date_time', '>=', $this->startDate)
            ->whereDate('date_time', '<=', $this->endDate);

        // Filtrar solo si enterpriseId existe
        if (!empty($this->enterpriseId) && $this->enterpriseId !== 'null') {
            $query->where('enterprise_id', $this->enterpriseId);
        }

        $receptions = $query->get();

        $rows = collect();

        foreach ($receptions as $reception) {
            foreach ($reception->packages as $package) {
                $rows->push([
                    'package' => $package,
                    'sender' => $reception->sender,
                    'recipient' => $reception->recipient,
                ]);
            }
        }

        return $rows;
    }

    /**
     * Mapear cada fila para Excel
     */
    public function map($row): array
    {
        $package = $row['package'];
        $sender = $row['sender'];
        $recipient = $row['recipient'];

        // Descripción de la carga
        $description = $package->items->map(fn($item) => $item->artPackage?->name)->filter()->implode(' ');

        return [
            $package->barcode,                   // HAWB
            'GYE',                               // Origen
            'JFK',                               // DESTINO
            1,                                   // PIEZAS
            $package->kilograms,                 // PESO
            $sender->full_name ?? '',            // NOMBRE DEL SHP
            $sender->address ?? '',              // DIRECCION 1 SHP
            $sender->city ?? '',                 // CIUDAD SHP
            'EC',                                // ESTADO REGION SHP
            'EC',                                // PAIS SHP
            $sender->postal_code ?? '',          // CODIGO POSTAL SHP
            $recipient->full_name ?? '',         // NOMBRE DEL CNE
            $recipient->address ?? '',           // DIRECCION 1 CNE
            $recipient->city ?? '',              // CIUDAD CNE
            $recipient->state ?? '',             // ESTADO REGION CNE
            'US',                                // PAIS CNE
            $recipient->postal_code ?? '',       // CODIGO POSTAL CNE
            $description,                        // DESCRIPCION DE LA CARGA
        ];
    }

    /**
     * Definir encabezados del Excel
     */
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
        // Aplicar estilo a la primera fila
        $sheet->getStyle('1:1')->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['argb' => 'FFFFFFFF'], // blanco
            ],
            'alignment' => [
                'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
                'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER,
            ],
            'fill' => [
                'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                'startColor' => [
                    'argb' => 'FF17365D', // Azul, Énfasis 1, Oscuro 25%
                ],
            ],
        ]);

        // Auto-ajustar ancho de todas las columnas según contenido
        $highestColumn = $sheet->getHighestColumn();
        foreach (range('A', $highestColumn) as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }
    }
}
