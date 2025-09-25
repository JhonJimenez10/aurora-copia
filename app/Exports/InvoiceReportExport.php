<?php

namespace App\Exports;

use App\Models\Reception;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class InvoiceReportExport implements FromCollection, WithHeadings, WithStyles, ShouldAutoSize, WithEvents
{
    protected string $startDate;
    protected string $endDate;
    protected string $enterpriseId;

    public function __construct(string $startDate, string $endDate, string $enterpriseId)
    {
        $this->startDate = $startDate;
        $this->endDate   = $endDate;
        $this->enterpriseId = $enterpriseId;
    }

    public function collection(): Collection
    {
        $receptions = Reception::with(['recipient', 'agencyDest', 'packages', 'packages.items.artPackage'])
            ->where('enterprise_id', $this->enterpriseId)
            ->where('annulled', false)
            ->whereDate('date_time', '>=', $this->startDate)
            ->whereDate('date_time', '<=', $this->endDate)
            ->orderByDesc('date_time')
            ->get();

        $rows = [];

        // Acumuladores de totales
        $sumPaquetes = 0.0;
        $sumLibras   = 0.0;
        $sumKilos    = 0.0;
        $sumTotal    = 0.0;

        foreach ($receptions as $r) {
            $destino      = optional($r->agencyDest)->name ?? '';
            $destinatario = optional($r->recipient)->full_name ?? '';
            $formaPago    = $r->pay_method ?? '';

            foreach ($r->packages as $p) {
                // Armar contenido concatenando los nombres de artículos
                $contenido = $p->items->map(function ($item) {
                    return optional($item->artPackage)->name;
                })->filter()->join(', ');
                $rows[] = [
                    $p->barcode ?? '',        // 0 Guia
                    $r->number ?? '',         // 1 Numero recepcion
                    $destino,                 // 2 Destino
                    $destinatario,            // 3 Destinatario
                    $contenido,               // 4 Contenido
                    $formaPago,               // 5 Forma de Pago
                    (float) ($p->pounds ?? 0),    // 4 Libras
                    (float) ($p->kilograms ?? 0), // 5 Kilos
                    (float) $r->pkg_total,    // 6 Paquetes
                    (float) $r->ins_pkg,      // 7 Seguro de paquetes
                    (float) $r->packaging,    // 8 Embalaje
                    (float) $r->ship_ins,     // 9 Seguro de envio
                    (float) $r->clearance,    // 10 Desaduanizacion
                    (float) $r->trans_dest,   // 11 Transporte destino
                    (float) $r->transmit,     // 12 Transmision
                    (float) $r->subtotal,     // 13 Subtotal
                    (float) $r->vat15,        // 14 IVA15%
                    (float) $r->total,        // 15 Total
                ];

                // Acumular
                $sumPaquetes += (float) $r->pkg_total;
                $sumLibras   += (float) ($p->pounds ?? 0);
                $sumKilos    += (float) ($p->kilograms ?? 0);
                $sumTotal    += (float) $r->total;
            }
        }

        // Fila separadora (opcional)
        $rows[] = array_fill(0, 18, '');

        // 4 filas de totales (mismo ancho de columnas)
        // Colocamos el valor SOLO en la columna correspondiente
        $totalPaquetesRow = array_fill(0, 18, '');
        $totalPaquetesRow[0] = 'Total paquetes';
        $totalPaquetesRow[8] = $sumPaquetes;

        $totalLibrasRow = array_fill(0, 18, '');
        $totalLibrasRow[0] = 'Total libras';
        $totalLibrasRow[6] = $sumLibras;

        $totalKilosRow = array_fill(0, 18, '');
        $totalKilosRow[0] = 'Total Kilos';
        $totalKilosRow[7] = $sumKilos;

        $totalTotalRow = array_fill(0, 18, '');
        $totalTotalRow[0] = 'Total Total';
        $totalTotalRow[17] = $sumTotal;

        $rows[] = $totalPaquetesRow;
        $rows[] = $totalLibrasRow;
        $rows[] = $totalKilosRow;
        $rows[] = $totalTotalRow;

        return collect($rows);
    }

    public function headings(): array
    {
        return [
            'Guia',
            'Numero recepcion',
            'Destino',
            'Destinatario',
            'Contenido',
            'Forma de Pago',
            'Libras',
            'Kilos',
            'Paquetes',
            'Seguro de paquetes',
            'Embalaje',
            'Seguro de envio',
            'Desaduanizacion',
            'Transporte destino',
            'Transmision',
            'Subtotal',
            'IVA15%',
            'Total',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]], // encabezados en negrita
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $highestRow = $sheet->getHighestRow();

                // Negrita para las 4 últimas filas (totales)
                for ($r = $highestRow - 3; $r <= $highestRow; $r++) {
                    $sheet->getStyle("A{$r}:P{$r}")->getFont()->setBold(true);
                }

                // Línea superior antes del bloque de totales
                $sheet->getStyle("A" . ($highestRow - 4) . ":P" . ($highestRow - 4))
                    ->getBorders()->getTop()->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN);
            },
        ];
    }
}
