<?php

namespace App\Exports;

use App\Models\Reception;
use App\Models\Enterprise;
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
    protected function normalizeString(?string $value): string
    {
        if (!$value) return '';
        $search  = ['ñ', 'Ñ'];
        $replace = ['n', 'N'];
        return str_replace($search, $replace, $value);
    }


    public function collection(): Collection
    {
        // Construir query base
        $query = Reception::with(['recipient', 'agencyDest', 'packages', 'packages.items.artPackage'])
            ->where('annulled', false)
            ->whereDate('date_time', '>=', $this->startDate)
            ->whereDate('date_time', '<=', $this->endDate);

        // Si NO es "all", filtrar por enterprise_id específico
        if ($this->enterpriseId !== 'all') {
            $query->where('enterprise_id', $this->enterpriseId);
        } else {
            // Si es "all", excluir COAVPRO
            $coavproIds = Enterprise::where('commercial_name', 'COAVPRO')
                ->pluck('id')
                ->toArray();

            if (!empty($coavproIds)) {
                $query->whereNotIn('enterprise_id', $coavproIds);
            }
        }

        $receptions = $query->orderByDesc('date_time')->get();

        $rows = [];

        // Acumuladores de totales
        $sumPaquetes = 0.0;
        $sumLibras   = 0.0;
        $sumKilos    = 0.0;
        $sumTotal    = 0.0;

        foreach ($receptions as $r) {
            $destino      = $this->normalizeString(optional($r->agencyDest)->name ?? '');
            $destinatario = $this->normalizeString(optional($r->recipient)->full_name ?? '');
            $telefonoDestinatario = $this->normalizeString(optional($r->recipient)->phone ?? '');
            $formaPago    = $this->normalizeString($r->pay_method ?? '');


            if ($r->packages->isEmpty()) {
                $rows[] = [
                    '',
                    $r->number ?? '',
                    $destino,
                    $destinatario,
                    $telefonoDestinatario,
                    '',
                    $formaPago,
                    0,
                    0,
                    (float) $r->pkg_total,
                    (float) $r->arancel,
                    (float) $r->ins_pkg,
                    (float) $r->packaging,
                    (float) $r->ship_ins,
                    (float) $r->clearance,
                    (float) $r->trans_dest,
                    (float) $r->transmit,
                    (float) $r->subtotal,
                    (float) $r->vat15,
                    (float) $r->total,
                ];

                $sumPaquetes += (float) $r->pkg_total;
                $sumTotal    += (float) $r->total;
                continue; // saltar al siguiente reception
            }

            foreach ($r->packages as $p) {
                // Armar contenido concatenando los nombres de artículos (si los hay)
                $contenido = '';
                if ($p->items && $p->items->count() > 0) {
                    $contenido = $p->items->map(function ($item) {
                        return $this->normalizeString(optional($item->artPackage)->name ?? '');
                    })->filter()->join(', ');
                }

                $rows[] = [
                    $p->barcode ?? '',        // 0 Guia
                    $r->number ?? '',         // 1 Numero recepcion
                    $destino,                 // 2 Destino
                    $destinatario,            // 3 Destinatario
                    $telefonoDestinatario,    // 4 TelefonoDestinatario
                    $contenido,               // 4 Contenido (vacío si no hay artPackage)
                    $formaPago,               // 5 Forma de Pago
                    (float) ($p->pounds ?? 0),    // 6 Libras
                    (float) ($p->kilograms ?? 0), // 7 Kilos
                    (float) $r->pkg_total,    // 8 Paquetes
                    (float) $r->arancel,      // 9 Arancel
                    (float) $r->ins_pkg,      // 10 Seguro de paquetes
                    (float) $r->packaging,    // 11 Embalaje
                    (float) $r->ship_ins,     // 12 Seguro de envio
                    (float) $r->clearance,    // 13 Desaduanizacion
                    (float) $r->trans_dest,   // 14 Transporte destino
                    (float) $r->transmit,     // 15 Transmision
                    (float) $r->subtotal,     // 16 Subtotal
                    (float) $r->vat15,        // 17 IVA15%
                    (float) $r->total,        // 18 Total
                ];

                // Acumular totales
                $sumPaquetes += (float) $r->pkg_total;
                $sumLibras   += (float) ($p->pounds ?? 0);
                $sumKilos    += (float) ($p->kilograms ?? 0);
                $sumTotal    += (float) $r->total;
            }
        }

        // Fila separadora (opcional)
        $rows[] = array_fill(0, 20, '');

        // 4 filas de totales (mismo ancho de columnas)
        // Colocamos el valor SOLO en la columna correspondiente
        $totalPaquetesRow = array_fill(0, 20, '');
        $totalPaquetesRow[0] = 'Total paquetes';
        $totalPaquetesRow[9] = $sumPaquetes;

        $totalLibrasRow = array_fill(0, 20, '');
        $totalLibrasRow[0] = 'Total libras';
        $totalLibrasRow[7] = $sumLibras;

        $totalKilosRow = array_fill(0, 20, '');
        $totalKilosRow[0] = 'Total Kilos';
        $totalKilosRow[8] = $sumKilos;

        $totalTotalRow = array_fill(0, 20, '');
        $totalTotalRow[0] = 'Total Total';
        $totalTotalRow[19] = $sumTotal;

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
            'TelefonoDestinatario',
            'Contenido',
            'Forma de Pago',
            'Libras',
            'Kilos',
            'Paquetes',
            'Arancel',
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
