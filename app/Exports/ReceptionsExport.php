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

        // Agrupar por recepción + guía hija
        $grouped = [];

        foreach ($receptions as $reception) {
            foreach ($reception->packages as $package) {
                $fullBarcode = $package->barcode ?? '';
                $parts = explode('.', $fullBarcode, 2);
                $guiaHija = $parts[0];

                $key = $reception->id . '|' . $guiaHija;

                if (! isset($grouped[$key])) {
                    $grouped[$key] = [
                        'tipo_envio'             => 'REGISTRO',
                        'subpartida'             => '0',
                        'fecha'                  => Carbon::parse($reception->date_time)->format('Y-m-d'),
                        'saca'                   => '0',
                        'guia_hija'              => $guiaHija,
                        'remitente'              => $reception->sender->full_name ?? '',
                        'id_remitente'           => $reception->sender->identification ?? '',
                        'destinatario'           => $reception->recipient->full_name ?? '',
                        'id_destinatario'        => $reception->recipient->identification ?? '',
                        'peso_kgs'               => 0,
                        'valor_fob'              => '',
                        'contenido'              => $package->artPackage->name ?? 'Sin artículo',
                        'piezas'                 => 0,
                        'remitente_ciudad'       => $reception->sender->city ?? '',
                        'remitente_direccion'    => $reception->sender->address ?? '',
                        'remitente_telefono'     => $reception->sender->phone ?? '',
                        'destinatario_ciudad'    => $reception->recipient->city ?? '',
                        'destinatario_direccion' => $reception->recipient->address ?? '',
                        'destinatario_telefono'  => $reception->recipient->phone ?? '',
                    ];
                }

                $grouped[$key]['piezas']   += 1;
                $grouped[$key]['peso_kgs'] += $package->kilograms ?? 0;
            }
        }

        return collect(array_values($grouped));
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
