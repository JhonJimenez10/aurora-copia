<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class WeightReportExport implements FromCollection, WithHeadings, WithStyles, ShouldAutoSize, WithEvents
{
    protected string $startDate;
    protected string $endDate;
    protected string $enterpriseId; // 'all' o uuid

    public function __construct(string $startDate, string $endDate, string $enterpriseId)
    {
        $this->startDate    = $startDate;
        $this->endDate      = $endDate;
        $this->enterpriseId = $enterpriseId;
    }

    public function collection(): Collection
    {
        $q = DB::table('receptions')
            ->join('packages', 'receptions.id', '=', 'packages.reception_id')
            ->join('enterprises', 'receptions.enterprise_id', '=', 'enterprises.id')
            ->select(
                'receptions.agency_origin as agencia_origen',
                DB::raw('SUM(packages.pounds)    AS total_libras'),
                DB::raw('SUM(packages.kilograms) AS total_kilos'),
                DB::raw('STRING_AGG(DISTINCT receptions.route, \', \') AS rutas') // PostgreSQL
            )
            ->where('receptions.annulled', 0)
            ->when($this->startDate, fn($q) => $q->whereDate('receptions.date_time', '>=', $this->startDate))
            ->when($this->endDate,   fn($q) => $q->whereDate('receptions.date_time', '<=', $this->endDate));

        // Filtro por empresa:
        if ($this->enterpriseId === 'all') {
            // "Todos" EXCLUYENDO COAVPRO
            $q->where('enterprises.commercial_name', '!=', 'COAVPRO');
        } else {
            $q->where('receptions.enterprise_id', $this->enterpriseId);
        }

        $weights = $q->groupBy('receptions.agency_origin')
            ->orderBy('receptions.agency_origin')
            ->get();

        $rows = [];
        $totalLibras = 0.0;
        $totalKilos  = 0.0;

        foreach ($weights as $r) {
            $lb = (float) ($r->total_libras ?? 0);
            $kg = (float) ($r->total_kilos  ?? 0);

            $rows[] = [
                $r->agencia_origen,
                $r->rutas,
                $lb,
                $kg,
            ];

            $totalLibras += $lb;
            $totalKilos  += $kg;
        }

        // Fila total
        $rows[] = [
            'TOTAL GENERAL: ' . count($weights) . ' registros',
            '-',
            $totalLibras,
            $totalKilos,
        ];

        return collect($rows);
    }

    public function headings(): array
    {
        return [
            'Agencia Origen',
            'Ruta',
            'Peso (Lbs)',
            'Peso (Kg)',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $last  = $sheet->getHighestRow();

                $sheet->getStyle("A{$last}:D{$last}")->applyFromArray([
                    'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                    'fill' => [
                        'fillType'   => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_GRADIENT_LINEAR,
                        'rotation'   => 0,
                        'startColor' => ['rgb' => 'FF5722'],
                        'endColor'   => ['rgb' => 'FFC107'],
                    ],
                    'alignment' => [
                        'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
                        'vertical'   => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER,
                    ],
                ]);
            },
        ];
    }
}
