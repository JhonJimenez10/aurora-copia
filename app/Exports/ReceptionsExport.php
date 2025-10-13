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

    protected function normalizeString(?string $value): string
    {
        if (!$value) return '';
        $search  = ['ñ', 'Ñ'];
        $replace = ['n', 'N'];
        return str_replace($search, $replace, $value);
    }

    public function collection(): Collection
    {
        $receptions = Reception::with(['sender', 'recipient', 'packages.artPackage'])
            ->where('enterprise_id', $this->enterpriseId)
            ->where('annulled', false)
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
                    $this->normalizeString(optional($reception->sender)->full_name ?? ''),
                    $this->normalizeString(optional($reception->sender)->identification ?? ''),
                    $this->normalizeString(optional($reception->recipient)->full_name ?? ''),
                    $this->normalizeString(optional($reception->recipient)->identification ?? ''),
                    0,                              // Peso Kgs
                    '',                             // Valor FOB
                    'Sin paquete',                  // Contenido
                    0,                              // Piezas
                    $this->normalizeString(optional($reception->sender)->city ?? ''),
                    $this->normalizeString(optional($reception->sender)->address ?? ''),
                    $this->normalizeString(optional($reception->sender)->phone ?? ''),
                    $this->normalizeString(optional($reception->recipient)->city ?? ''),
                    $this->normalizeString(optional($reception->recipient)->address ?? ''),
                    $this->normalizeString(optional($reception->recipient)->phone ?? ''),
                ];
                continue; // siguiente recepción
            }

            // si tiene paquetes, los recorremos normalmente
            foreach ($reception->packages as $package) {
                $fullBarcode = $package->barcode ?? '';
                $parts = explode('.', $fullBarcode, 2);
                $guiaHija = $parts[0] ?? '';

                $contenido = $this->normalizeString(optional($package->artPackage)->name ?? 'Sin artículo');

                $rows[] = [
                    'REGISTRO',
                    '0',
                    Carbon::parse($reception->date_time)->format('Y-m-d'),
                    '0',
                    $guiaHija,
                    $this->normalizeString(optional($reception->sender)->full_name ?? ''),
                    $this->normalizeString(optional($reception->sender)->identification ?? ''),
                    $this->normalizeString(optional($reception->recipient)->full_name ?? ''),
                    $this->normalizeString(optional($reception->recipient)->identification ?? ''),
                    (float) ($package->kilograms ?? 0),
                    '',
                    $contenido,
                    1, // cada paquete cuenta como una pieza
                    $this->normalizeString(optional($reception->sender)->city ?? ''),
                    $this->normalizeString(optional($reception->sender)->address ?? ''),
                    $this->normalizeString(optional($reception->sender)->phone ?? ''),
                    $this->normalizeString(optional($reception->recipient)->city ?? ''),
                    $this->normalizeString(optional($reception->recipient)->address ?? ''),
                    $this->normalizeString(optional($reception->recipient)->phone ?? ''),
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
