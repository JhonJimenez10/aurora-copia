<?php

namespace App\Exports;

use App\Models\Reception;
use App\Models\Enterprise;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ACASAviancaManifestExport implements FromCollection, WithMapping, WithHeadings, WithStyles
{
    protected string $startDate;
    protected string $endDate;
    protected string $enterpriseId; // puede ser 'all' o un id
    protected Collection $groupedData;

    /** Longitud máxima para nombre/dirección */
    private const MAX_LEN = 30;

    public function __construct($startDate, $endDate, $enterpriseId)
    {
        $this->startDate    = (string) $startDate;
        $this->endDate      = (string) $endDate;
        $this->enterpriseId = (string) $enterpriseId;
        $this->groupedData  = collect();
    }

    /** Reemplaza ñ/Ñ por n/N */
    protected function normalizeString(?string $value): string
    {
        if (!$value) return '';
        return str_replace(['ñ', 'Ñ'], ['n', 'N'], $value);
    }

    /** Normaliza y recorta a 30 caracteres (UTF-8 seguro) */
    protected function clip30(?string $value): string
    {
        $t = trim($this->normalizeString($value ?? ''));
        if ($t === '') return '';
        return mb_substr($t, 0, self::MAX_LEN, 'UTF-8');
    }

    public function collection(): Collection
    {
        $query = Reception::with(['sender', 'recipient', 'packages.items.artPackage'])
            ->where('annulled', false)
            ->whereDate('date_time', '>=', $this->startDate)
            ->whereDate('date_time', '<=', $this->endDate);

        // Soporte "TODAS" => excluir COAVPRO
        if ($this->enterpriseId !== 'all') {
            $query->where('enterprise_id', $this->enterpriseId);
        } else {
            $coavproIds = Enterprise::where('commercial_name', 'COAVPRO')->pluck('id')->toArray();
            if (!empty($coavproIds)) {
                $query->whereNotIn('enterprise_id', $coavproIds);
            }
        }

        $receptions = $query->orderBy('enterprise_id')->orderByDesc('date_time')->get();

        $grouped = []; // agrupación por HAWB base (antes del .)

        foreach ($receptions as $reception) {
            foreach ($reception->packages as $package) {
                $baseCode = Str::before((string) ($package->barcode ?? ''), '.');

                if (!isset($grouped[$baseCode])) {
                    $grouped[$baseCode] = [
                        'hawb'      => $baseCode,
                        'sender'    => $reception->sender,
                        'recipient' => $reception->recipient,
                        'pieces'    => 0,
                        'weight'    => 0.0,
                        'contents'  => [],
                    ];
                }

                $grouped[$baseCode]['pieces'] += 1;
                $grouped[$baseCode]['weight'] += (float) ($package->kilograms ?? 0);

                // Descripción desde items (translation o name)
                $desc = $package->items
                    ->map(function ($item) {
                        if ($item->artPackage) {
                            return $item->artPackage->translation ?: $item->artPackage->name;
                        }
                        return null;
                    })
                    ->filter()
                    ->implode(' ');

                if (!empty($desc)) {
                    $grouped[$baseCode]['contents'][] = $desc;
                }
            }
        }

        $this->groupedData = collect(array_values($grouped));
        return $this->groupedData;
    }

    public function map($row): array
    {
        // $row es un array con claves hawb, sender, recipient, pieces, weight, contents
        return [
            $row['hawb'],                                           // HAWB
            'GYE',                                                  // Origen
            'JFK',                                                  // Destino
            (int) $row['pieces'],                                   // Piezas
            (float) $row['weight'],                                 // Peso

            // Remitente (SHP) con tope 30
            $this->clip30(optional($row['sender'])->full_name ?? ''),   // NOMBRE DEL SHP
            $this->clip30(optional($row['sender'])->address ?? ''),     // DIRECCION 1 SHP

            // Otros campos SHP (sin tope)
            $this->normalizeString(optional($row['sender'])->city ?? ''),        // CIUDAD SHP
            'EC',                                                   // ESTADO REGION SHP
            'EC',                                                   // PAIS SHP
            $this->normalizeString(optional($row['sender'])->postal_code ?? ''), // CODIGO POSTAL SHP

            // Destinatario (CNE) con tope 30
            $this->clip30(optional($row['recipient'])->full_name ?? ''), // NOMBRE DEL CNE
            $this->clip30(optional($row['recipient'])->address ?? ''),   // DIRECCION 1 CNE

            // Otros campos CNE (sin tope)
            $this->normalizeString(optional($row['recipient'])->city ?? ''),     // CIUDAD CNE
            $this->normalizeString(optional($row['recipient'])->state ?? ''),    // ESTADO REGION CNE
            'US',                                                   // PAIS CNE
            $this->normalizeString(optional($row['recipient'])->postal_code ?? ''),  // CODIGO POSTAL CNE

            // Descripción (sin tope por ahora)
            $this->normalizeString(implode(', ', $row['contents'] ?? [])),      // DESCRIPCION DE LA CARGA
        ];
    }

    public function headings(): array
    {
        return [
            'HAWB',
            'Origen',
            'DESTINO',
            'PIEZAS',
            'PESO',
            'NOMBRE DEL SHP',
            'DIRECCION 1 SHP',
            'CIUDAD SHP',
            'ESTADO REGION',
            'PAIS',
            'CODIGO POSTAL',
            'NOMBRE DEL CNE',
            'DIRECCION 1 CNE',
            'CIUDAD CNE',
            'ESTADO REGION CNE',
            'PAIS CNE',
            'CODIGO POSTAL CNE',
            'DESCRIPCION DE LA CARGA',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        // Encabezado en negrita y centrado
        $sheet->getStyle('1:1')->applyFromArray([
            'font' => ['bold' => true],
            'alignment' => [
                'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
                'vertical'   => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER,
            ],
        ]);

        // AutoSize a todas las columnas
        $highestColumn = $sheet->getHighestColumn();
        foreach (range('A', $highestColumn) as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        return [];
    }
}
