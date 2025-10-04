<?php

namespace App\Exports;

use App\Models\Reception;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Carbon\Carbon;

class ReceptionsExport implements FromCollection, WithHeadings, WithStyles, ShouldAutoSize
{
    protected $startDate;
    protected $endDate;
    protected $enterpriseId;

    public function __construct(string $startDate, string $endDate, string $enterpriseId)
    {
        $this->startDate    = $startDate;
        $this->endDate      = $endDate;
        $this->enterpriseId = $enterpriseId;
    }

    public function collection(): Collection
    {
        $receptions = Reception::with(['sender', 'recipient', 'packages.artPackage'])
            ->where('enterprise_id', $this->enterpriseId)
            ->whereDate('date_time', '>=', $this->startDate)
            ->whereDate('date_time', '<=', $this->endDate)
            ->get();

        $rows = [];

        foreach ($receptions as $reception) {
            // si NO tiene paquetes, igual agregamos una fila
            if ($reception->packages->isEmpty()) {
                $rows[] = [
                    'REGISTRO',                     // Tipo de Envío
                    '0',                            // Subpartida
                    Carbon::parse($reception->date_time)->format('Y-m-d'),
                    '0',                            // Saca
                    '',                             // Guía Hija
                    optional($reception->sender)->full_name ?? '',
                    optional($reception->sender)->identification ?? '',
                    optional($reception->recipient)->full_name ?? '',
                    optional($reception->recipient)->identification ?? '',
                    0,                              // Peso Kgs
                    '',                             // Valor FOB
                    'Sin paquete',                  // Contenido
                    0,                              // Piezas
                    optional($reception->sender)->city ?? '',
                    optional($reception->sender)->address ?? '',
                    optional($reception->sender)->phone ?? '',
                    optional($reception->recipient)->city ?? '',
                    optional($reception->recipient)->address ?? '',
                    optional($reception->recipient)->phone ?? '',
                ];
                continue; // siguiente recepción
            }

            // si tiene paquetes, los recorremos normalmente
            foreach ($reception->packages as $package) {
                $fullBarcode = $package->barcode ?? '';
                $parts = explode('.', $fullBarcode, 2);
                $guiaHija = $parts[0] ?? '';

                $contenido = optional($package->artPackage)->name ?? 'Sin artículo';

                $rows[] = [
                    'REGISTRO',
                    '0',
                    Carbon::parse($reception->date_time)->format('Y-m-d'),
                    '0',
                    $guiaHija,
                    optional($reception->sender)->full_name ?? '',
                    optional($reception->sender)->identification ?? '',
                    optional($reception->recipient)->full_name ?? '',
                    optional($reception->recipient)->identification ?? '',
                    (float) ($package->kilograms ?? 0),
                    '',
                    $contenido,
                    1, // cada paquete cuenta como una pieza
                    optional($reception->sender)->city ?? '',
                    optional($reception->sender)->address ?? '',
                    optional($reception->sender)->phone ?? '',
                    optional($reception->recipient)->city ?? '',
                    optional($reception->recipient)->address ?? '',
                    optional($reception->recipient)->phone ?? '',
                ];
            }
        }

        return collect($rows);
    }

    public function headings(): array
    {
        return [
            'Tipo de Envío',
            'SubPartida',
            'Fecha',
            'Saca',
            'Guía Hija',
            'Remitente',
            'ID Remitente',
            'Destinatario',
            'ID Destinatario',
            'Peso Kgs',
            'Valor FOB',
            'Contenido',
            'Piezas',
            'Remitente Ciudad',
            'Remitente Dirección',
            'Remitente Teléfono',
            'Destinatario Ciudad',
            'Destinatario Dirección',
            'Destinatario Teléfono',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => [
                    'bold'  => true,
                    'color' => ['rgb' => '000000'],
                ],
            ],
        ];
    }
}
