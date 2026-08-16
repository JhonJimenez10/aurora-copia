<?php

namespace App\Exports;

use App\Models\Reception;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Carbon\Carbon;

/**
 * Mismo formato que ReceptionsExport, pero filtrado a UN SOLO embarque:
 * solo salen los paquetes que están dentro de alguna saca de ese embarque
 * (no se filtra por rango de fechas ni por "sin paquete", porque aquí solo
 * interesan los paquetes reales que se metieron a ese embarque).
 */
class ShipmentReceptionsExport implements FromCollection, WithHeadings, WithStyles, ShouldAutoSize
{
    protected string $shipmentId;

    private const MAX_LEN = 30;

    public function __construct(string $shipmentId)
    {
        $this->shipmentId = $shipmentId;
    }

    protected function normalizeString(?string $value): string
    {
        if (!$value) return '';
        $search  = ['ñ', 'Ñ'];
        $replace = ['n', 'N'];
        return str_replace($search, $replace, $value);
    }

    protected function clip(?string $value, int $limit = self::MAX_LEN): string
    {
        $text = trim($this->normalizeString($value ?? ''));
        if ($text === '') return '';
        return mb_substr($text, 0, $limit, 'UTF-8');
    }

    public function collection(): Collection
    {
        $rows = [];

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
                'packages.artPackage',
            ])
            ->whereHas('packages', function ($q) use ($packageIds) {
                $q->whereIn('id', $packageIds);
            })
            ->orderByDesc('date_time')
            ->get();

        foreach ($receptions as $reception) {
            foreach ($reception->packages as $package) {
                $fullBarcode = $package->barcode ?? '';
                $parts = explode('.', $fullBarcode, 2);
                $guiaHija = $parts[0] ?? '';

                $contenido = $this->normalizeString(optional($package->artPackage)->name ?? 'Sin artículo');

                $sacaNumber = $sackNumbersByPackageId[$package->id] ?? '0';

                $rows[] = [
                    'REGISTRO',
                    '0',
                    Carbon::parse($reception->date_time)->format('Y-m-d'),
                    $sacaNumber, // número de saca del embarque
                    $guiaHija,
                    $this->clip(optional($reception->sender)->full_name ?? ''),    // <- máx 30
                    $this->normalizeString(optional($reception->sender)->identification ?? ''),
                    $this->clip(optional($reception->recipient)->full_name ?? ''), // <- máx 30
                    $this->normalizeString(optional($reception->recipient)->identification ?? ''),
                    (float) ($package->kilograms ?? 0),
                    '',
                    $contenido,
                    1, // cada paquete = 1 pieza
                    $this->normalizeString(optional($reception->sender)->city ?? ''),
                    $this->clip(optional($reception->sender)->address ?? ''),      // <- máx 30
                    $this->normalizeString(optional($reception->sender)->phone ?? ''),
                    $this->normalizeString(optional($reception->recipient)->city ?? ''),
                    $this->clip(optional($reception->recipient)->address ?? ''),   // <- máx 30
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