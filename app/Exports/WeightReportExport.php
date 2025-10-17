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

    public function __construct(string $startDate, string $endDate)
    {
        $this->startDate = $startDate;
        $this->endDate   = $endDate;
    }

    public function collection(): Collection
    {
        $weights = DB::table('receptions')
            ->join('agencies_dest', 'receptions.agency_dest', '=', 'agencies_dest.id')
            ->join('packages', 'receptions.id', '=', 'packages.reception_id')
            ->select(
                'receptions.agency_origin as agencia_origen',
                DB::raw('SUM(packages.pounds) as total_libras'),
                DB::raw('SUM(packages.kilograms) as total_kilos'),
                DB::raw('STRING_AGG(DISTINCT receptions.route, \', \') as rutas') // PostgreSQL
            )
            ->where('receptions.annulled', 0)
            ->when($this->startDate, fn($q) => $q->whereDate('receptions.date_time', '>=', $this->startDate))
            ->when($this->endDate, fn($q) => $q->whereDate('receptions.date_time', '<=', $this->endDate))
            ->groupBy('receptions.agency_origin')
            ->orderBy('receptions.agency_origin')
            ->get();

        $rows = [];
        $totalLibras = 0;
        $totalKilos = 0;

        foreach ($weights as $r) {
            $rows[] = [
                $r->agencia_origen,
                $r->rutas,
                (float) $r->total_libras,
                (float) $r->total_kilos,
            ];

            $totalLibras += (float) $r->total_libras;
            $totalKilos += (float) $r->total_kilos;
        }

        // Fila final TOTAL GENERAL
        $rows[] = [
            "TOTAL GENERAL: " . count($weights) . " registros",
            "-",
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
            1 => ['font' => ['bold' => true]], // encabezados en negrita
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $highestRow = $sheet->getHighestRow();

                // Estilo moderno para la fila TOTAL GENERAL
                $sheet->getStyle("A{$highestRow}:D{$highestRow}")->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'color' => ['rgb' => 'FFFFFF'],
                    ],
                    'fill' => [
                        'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_GRADIENT_LINEAR,
                        'rotation' => 0,
                        'startColor' => ['rgb' => 'FF5722'], // naranja
                        'endColor' => ['rgb' => 'FFC107'],   // amarillo
                    ],
                    'alignment' => [
                        'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
                    ],
                ]);
            },
        ];
    }
}
