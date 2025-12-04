<?php

namespace App\Exports;

use App\Models\Reception;
use App\Models\Enterprise;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Carbon\Carbon;

class ReceptionsExport implements FromCollection, WithHeadings, WithStyles, ShouldAutoSize
{
    protected string $startDate;
    protected string $endDate;
    protected string $enterpriseId;

    /** Longitud máxima para nombre/dirección */
    private const MAX_LEN = 30;

    public function __construct(string $startDate, string $endDate, string $enterpriseId)
    {
        $this->startDate    = $startDate;
        $this->endDate      = $endDate;
        $this->enterpriseId = $enterpriseId;
    }

    /**
     * Normaliza cadenas reemplazando ñ/Ñ por n/N
     */
    protected function normalizeString(?string $value): string
    {
        if (!$value) return '';
        $search  = ['ñ', 'Ñ'];
        $replace = ['n', 'N'];
        return str_replace($search, $replace, $value);
    }

    /**
     * Normaliza y recorta a un máximo de N caracteres (por defecto 30).
     */
    protected function clip(?string $value, int $limit = self::MAX_LEN): string
    {
        $text = trim($this->normalizeString($value ?? ''));
        if ($text === '') return '';
        // Corte duro respetando UTF-8
        return mb_substr($text, 0, $limit, 'UTF-8');
    }

    public function collection(): Collection
    {
        // Query base
        $query = Reception::with(['sender', 'recipient', 'packages.artPackage'])
            ->where('annulled', false)
            ->whereDate('date_time', '>=', $this->startDate)
            ->whereDate('date_time', '<=', $this->endDate);

        // Filtro por empresa:
        if ($this->enterpriseId !== 'all') {
            $query->where('enterprise_id', $this->enterpriseId);
        } else {
            $coavproIds = Enterprise::where('commercial_name', 'COAVPRO')
                ->pluck('id')->toArray();

            if (!empty($coavproIds)) {
                $query->whereNotIn('enterprise_id', $coavproIds);
            }
        }

        // Ordenado por empresa y fecha descendente
        $receptions = $query
            ->orderBy('enterprise_id')
            ->orderByDesc('date_time')
            ->get();

        $rows = [];

        foreach ($receptions as $reception) {
            // Si NO tiene paquetes, igual agregamos una fila
            if ($reception->packages->isEmpty()) {
                $rows[] = [
                    'REGISTRO',                     // Tipo de Envío
                    '0',                            // Subpartida
                    Carbon::parse($reception->date_time)->format('Y-m-d'),
                    '0',                            // Saca
                    '',                             // Guía Hija
                    $this->clip(optional($reception->sender)->full_name ?? ''),   // <- máx 30
                    $this->normalizeString(optional($reception->sender)->identification ?? ''),
                    $this->clip(optional($reception->recipient)->full_name ?? ''), // <- máx 30
                    $this->normalizeString(optional($reception->recipient)->identification ?? ''),
                    0,                              // Peso Kgs
                    '',                             // Valor FOB
                    $this->normalizeString('Sin paquete'), // Contenido
                    0,                              // Piezas
                    $this->normalizeString(optional($reception->sender)->city ?? ''),
                    $this->clip(optional($reception->sender)->address ?? ''),     // <- máx 30
                    $this->normalizeString(optional($reception->sender)->phone ?? ''),
                    $this->normalizeString(optional($reception->recipient)->city ?? ''),
                    $this->clip(optional($reception->recipient)->address ?? ''),  // <- máx 30
                    $this->normalizeString(optional($reception->recipient)->phone ?? ''),
                ];
                continue;
            }

            // Con paquetes: una fila por paquete
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
