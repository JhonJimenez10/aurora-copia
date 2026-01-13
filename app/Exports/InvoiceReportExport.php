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
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;

class InvoiceReportExport implements FromCollection, WithHeadings, WithStyles, ShouldAutoSize, WithEvents
{
    protected string $startDate;
    protected string $endDate;
    protected string $enterpriseId;
    protected array $enterpriseHeaderRows = [];

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
        // Construir query base - ✅ Agregamos 'sender' al with
        $query = Reception::with(['sender', 'recipient', 'agencyDest', 'packages', 'packages.items.artPackage', 'enterprise'])
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

        $receptions = $query->orderBy('enterprise_id')->orderByDesc('date_time')->get();

        $rows = [];
        $currentRow = 2;

        // Acumuladores globales
        $globalSumPaquetes = 0.0;
        $globalSumLibras   = 0.0;
        $globalSumKilos    = 0.0;
        $globalSumTotal    = 0.0;

        // Agrupar por empresa
        $groupedByEnterprise = $receptions->groupBy('enterprise_id');

        foreach ($groupedByEnterprise as $enterpriseId => $enterpriseReceptions) {
            $enterprise = $enterpriseReceptions->first()->enterprise;
            $enterpriseName = $enterprise->name ?? "Empresa #{$enterpriseId}";

            // Fila de encabezado de empresa
            $rows[] = [
                "EMPRESA: {$enterpriseName}",
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                ''
            ];

            $this->enterpriseHeaderRows[] = $currentRow;
            $currentRow++;

            // Acumuladores por empresa
            $sumPaquetes = 0.0;
            $sumLibras   = 0.0;
            $sumKilos    = 0.0;
            $sumTotal    = 0.0;

            foreach ($enterpriseReceptions as $r) {
                $destino              = $this->normalizeString(optional($r->agencyDest)->name ?? '');
                $destinatario         = $this->normalizeString(optional($r->recipient)->full_name ?? '');
                $telefonoDestinatario = $this->normalizeString(optional($r->recipient)->phone ?? '');
                $direccionRemitente   = $this->normalizeString(optional($r->sender)->address ?? ''); // ✅ CAMBIADO a sender
                $formaPago            = $this->normalizeString($r->pay_method ?? '');

                if ($r->packages->isEmpty()) {
                    $rows[] = [
                        '',
                        $r->number ?? '',
                        $destino,
                        $destinatario,
                        $telefonoDestinatario,
                        $direccionRemitente, // ✅ Dirección del remitente
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
                    $currentRow++;
                    continue;
                }

                foreach ($r->packages as $p) {
                    $contenido = '';
                    if ($p->items && $p->items->count() > 0) {
                        $contenido = $p->items->map(function ($item) {
                            return $this->normalizeString(optional($item->artPackage)->name ?? '');
                        })->filter()->join(', ');
                    }

                    $rows[] = [
                        $p->barcode ?? '',
                        $r->number ?? '',
                        $destino,
                        $destinatario,
                        $telefonoDestinatario,
                        $direccionRemitente, // ✅ Dirección del remitente
                        $contenido,
                        $formaPago,
                        (float) ($p->pounds ?? 0),
                        (float) ($p->kilograms ?? 0),
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
                    $sumLibras   += (float) ($p->pounds ?? 0);
                    $sumKilos    += (float) ($p->kilograms ?? 0);
                    $sumTotal    += (float) $r->total;
                    $currentRow++;
                }
            }

            // Subtotales por empresa
            $rows[] = array_fill(0, 21, '');
            $currentRow++;

            $subtotalRow = array_fill(0, 21, '');
            $subtotalRow[0] = "SUBTOTAL {$enterpriseName}";
            $subtotalRow[8] = $sumLibras;
            $subtotalRow[9] = $sumKilos;
            $subtotalRow[10] = $sumPaquetes;
            $subtotalRow[20] = $sumTotal;
            $rows[] = $subtotalRow;
            $currentRow++;

            // Fila separadora entre empresas
            $rows[] = array_fill(0, 21, '');
            $currentRow++;

            // Acumular a los totales globales
            $globalSumPaquetes += $sumPaquetes;
            $globalSumLibras   += $sumLibras;
            $globalSumKilos    += $sumKilos;
            $globalSumTotal    += $sumTotal;
        }

        // TOTALES GENERALES (si es "all")
        if ($this->enterpriseId === 'all') {
            $rows[] = array_fill(0, 21, '');

            $totalPaquetesRow = array_fill(0, 21, '');
            $totalPaquetesRow[0] = 'TOTAL GENERAL - Paquetes';
            $totalPaquetesRow[10] = $globalSumPaquetes;
            $rows[] = $totalPaquetesRow;

            $totalLibrasRow = array_fill(0, 21, '');
            $totalLibrasRow[0] = 'TOTAL GENERAL - Libras';
            $totalLibrasRow[8] = $globalSumLibras;
            $rows[] = $totalLibrasRow;

            $totalKilosRow = array_fill(0, 21, '');
            $totalKilosRow[0] = 'TOTAL GENERAL - Kilos';
            $totalKilosRow[9] = $globalSumKilos;
            $rows[] = $totalKilosRow;

            $totalTotalRow = array_fill(0, 21, '');
            $totalTotalRow[0] = 'TOTAL GENERAL';
            $totalTotalRow[20] = $globalSumTotal;
            $rows[] = $totalTotalRow;
        }

        return collect($rows);
    }

    public function headings(): array
    {
        return [
            'Guia',
            'Numero recepcion',
            'Destino',
            'Destinatario',
            'Telefono Destinatario',
            'Direccion Remitente', // ✅ CAMBIADO el nombre
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
            1 => ['font' => ['bold' => true]],
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $highestRow = $sheet->getHighestRow();

                // Estilo para encabezados de empresa
                foreach ($this->enterpriseHeaderRows as $rowNum) {
                    $sheet->getStyle("A{$rowNum}:U{$rowNum}")
                        ->applyFromArray([
                            'font' => [
                                'bold' => true,
                                'size' => 12,
                                'color' => ['rgb' => 'FFFFFF']
                            ],
                            'fill' => [
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => ['rgb' => '2563EB']
                            ],
                            'borders' => [
                                'allBorders' => [
                                    'borderStyle' => Border::BORDER_THIN,
                                ]
                            ]
                        ]);

                    $sheet->mergeCells("A{$rowNum}:U{$rowNum}");
                }

                // Negrita para filas de SUBTOTAL y TOTAL GENERAL
                for ($r = 2; $r <= $highestRow; $r++) {
                    $cellValue = $sheet->getCell("A{$r}")->getValue();

                    if (
                        is_string($cellValue) &&
                        (str_starts_with($cellValue, 'SUBTOTAL') ||
                            str_starts_with($cellValue, 'TOTAL GENERAL'))
                    ) {

                        $isGeneralTotal = str_starts_with($cellValue, 'TOTAL GENERAL');

                        $sheet->getStyle("A{$r}:U{$r}")
                            ->applyFromArray([
                                'font' => [
                                    'bold' => true,
                                    'size' => $isGeneralTotal ? 12 : 10,
                                    'color' => ['rgb' => $isGeneralTotal ? 'FFFFFF' : '000000']
                                ],
                                'fill' => [
                                    'fillType' => Fill::FILL_SOLID,
                                    'startColor' => ['rgb' => $isGeneralTotal ? 'DC2626' : 'FCD34D']
                                ],
                                'borders' => [
                                    'top' => ['borderStyle' => Border::BORDER_THIN]
                                ]
                            ]);
                    }
                }
            },
        ];
    }
}
