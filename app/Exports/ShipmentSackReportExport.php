<?php

namespace App\Exports;

use App\Models\ShipmentSack;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ShipmentSackReportExport implements FromCollection, WithHeadings, WithStyles, ShouldAutoSize
{
    protected string $shipmentSackId;
    protected string $agencyDestId;

    public function __construct(string $shipmentSackId, string $agencyDestId)
    {
        $this->shipmentSackId = $shipmentSackId;
        $this->agencyDestId   = $agencyDestId;
    }

    protected function normalizeString(?string $value): string
    {
        if (!$value) return '';
        return str_replace(['ñ', 'Ñ'], ['n', 'N'], $value);
    }

    public function collection(): Collection
    {
        $shipmentSack = ShipmentSack::with([
            'shipment',
            'transferSack.sackPackages' => function ($q) {
                $q->where('confirmed', true)
                  ->with([
                      'package.reception.sender',
                      'package.reception.recipient',
                      'package.reception.agencyDest',
                  ]);
            },
        ])->findOrFail($this->shipmentSackId);

        $shipment  = $shipmentSack->shipment;
        $sackLabel = ($shipment->sack_prefix ?? '') . $shipmentSack->sack_number;

        $rows = [];

        foreach ($shipmentSack->transferSack->sackPackages as $sp) {
            $reception = $sp->package?->reception;

            if (!$reception || $reception->agency_dest !== $this->agencyDestId) {
                continue;
            }

            $rows[] = [
                $shipment->number,
                $sackLabel,
                $sp->package->barcode ?? '',
                $this->normalizeString($sp->package->content ?? ''),
                $sp->package->service_type ?? '',
                (float) $sp->pounds,
                (float) $sp->kilograms,
                $this->normalizeString(optional($reception->sender)->full_name ?? ''),
                $this->normalizeString(optional($reception->recipient)->full_name ?? ''),
                $this->normalizeString(optional($reception->recipient)->phone ?? ''),
                $this->normalizeString(optional($reception->recipient)->address ?? ''),
                $this->normalizeString(optional($reception->agencyDest)->name ?? ''),
            ];
        }

        return collect($rows);
    }

    public function headings(): array
    {
        return [
            'No. Embarque',
            'No. Saca',
            'Código',
            'Contenido',
            'Tipo Servicio',
            'Libras',
            'Kilos',
            'Remitente',
            'Destinatario',
            'Teléfono Destinatario',
            'Dirección Destinatario',
            'Agencia Destino',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}