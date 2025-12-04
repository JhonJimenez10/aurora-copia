<?php

namespace App\Http\Controllers;

use App\Models\Reception;
use App\Models\Enterprise;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\ReceptionsExport;
use App\Exports\InvoiceReportExport;
use App\Exports\IBCManifestExport;
use App\Exports\AirlineManifestExport;
use App\Exports\ACASAviancaManifestExport;
use Carbon\Carbon;

class ReportController extends Controller
{
    protected function roleUpper(): string
    {
        $u = auth()->user();
        if (!$u) return '';
        if (isset($u->role) && is_object($u->role) && isset($u->role->name)) return strtoupper((string)$u->role->name);
        if (isset($u->role_name) && is_string($u->role_name)) return strtoupper($u->role_name);
        if (isset($u->role) && is_string($u->role)) return strtoupper($u->role);
        return '';
    }

    protected function canChooseAnyEnterprise(): bool
    {
        return in_array($this->roleUpper(), ['SUDO', 'ADMIN'], true);
    }

    protected function getVisibleEnterprises()
    {
        return Enterprise::select('id', 'name', 'commercial_name')
            ->when(!$this->canChooseAnyEnterprise(), fn($q) => $q->where('id', auth()->user()->enterprise_id))
            ->orderBy('name')
            ->get();
    }

    /* =======================
       Recepciones (resumen)
       ======================= */
    public function index(Request $request)
    {
        $start        = $request->query('start_date');
        $end          = $request->query('end_date');
        $enterpriseId = $request->query('enterprise_id'); // 'all' o id

        $enterprises = $this->getVisibleEnterprises();
        $receptions  = [];

        if ($enterpriseId && $start && $end) {
            if (!$this->canChooseAnyEnterprise()) {
                $enterpriseId = (string) auth()->user()->enterprise_id;
            }

            session([
                'reports.enterprise_id' => $enterpriseId,
                'reports.start_date'    => $start,
                'reports.end_date'      => $end,
            ]);

            $query = Reception::with(['sender', 'recipient', 'packages.artPackage'])
                ->where('annulled', false)
                ->whereDate('date_time', '>=', $start)
                ->whereDate('date_time', '<=', $end);

            if ($enterpriseId !== 'all') {
                $query->where('enterprise_id', $enterpriseId);
            } else {
                $coavproIds = Enterprise::where('commercial_name', 'COAVPRO')->pluck('id')->toArray();
                if (!empty($coavproIds)) $query->whereNotIn('enterprise_id', $coavproIds);
            }

            $receptions = $query->orderBy('enterprise_id')->orderByDesc('date_time')->get();
        }

        return Inertia::render('Reports/Index', [
            'enterprises'  => $enterprises,
            'receptions'   => $receptions,
            'enterpriseId' => $enterpriseId,
            'startDate'    => $start,
            'endDate'      => $end,
        ]);
    }

    public function export(Request $request)
    {
        $start = $request->query('start_date') ?? session('reports.start_date');
        $end   = $request->query('end_date')   ?? session('reports.end_date');

        validator(['start_date' => $start, 'end_date' => $end], [
            'start_date' => ['required', 'date'],
            'end_date'   => ['required', 'date', 'after_or_equal:start_date'],
        ])->validate();

        $enterpriseId = $request->query('enterprise_id')
            ?? session('reports.enterprise_id')
            ?? (string) auth()->user()->enterprise_id;

        if (!$this->canChooseAnyEnterprise()) {
            $enterpriseId = (string) auth()->user()->enterprise_id;
        }

        $fileName = sprintf(
            'envios_%s_%s_emp%s.xlsx',
            Carbon::parse($start)->format('Ymd'),
            Carbon::parse($end)->format('Ymd'),
            $enterpriseId === 'all' ? 'TODAS' : $enterpriseId
        );

        return Excel::download(new ReceptionsExport($start, $end, (string) $enterpriseId), $fileName);
    }

    /* =======================
       Facturación (resumen)
       ======================= */
    public function invoiceIndex(Request $request)
    {
        $start = $request->query('start_date');
        $end   = $request->query('end_date');
        $enterpriseId = $request->query('enterprise_id');

        $enterprises = Enterprise::select('id', 'name', 'commercial_name')
            ->where('commercial_name', '!=', 'COAVPRO')
            ->when(!$this->canChooseAnyEnterprise(), fn($q) => $q->where('id', auth()->user()->enterprise_id))
            ->orderBy('name')->get();

        $rows = [];

        if ($enterpriseId && $start && $end) {
            if (!$this->canChooseAnyEnterprise()) $enterpriseId = auth()->user()->enterprise_id;

            session([
                'reports.invoice.enterprise_id' => $enterpriseId,
                'reports.invoice.start_date'    => $start,
                'reports.invoice.end_date'      => $end,
            ]);

            $query = Reception::with(['recipient', 'enterprise'])
                ->where('annulled', false)
                ->whereDate('date_time', '>=', $start)
                ->whereDate('date_time', '<=', $end);

            if ($enterpriseId !== 'all') {
                $query->where('enterprise_id', $enterpriseId);
            } else {
                $coavproIds = Enterprise::where('commercial_name', 'COAVPRO')->pluck('id')->toArray();
                if (!empty($coavproIds)) $query->whereNotIn('enterprise_id', $coavproIds);
            }

            $receptions = $query->orderByDesc('date_time')->get();

            foreach ($receptions as $r) {
                $rows[] = [
                    'numero_recepcion'      => $r->number ?? '',
                    'destinatario'          => optional($r->recipient)->full_name ?? '',
                    'telefono_destinatario' => optional($r->recipient)->phone ?? '',
                    'subtotal'              => (float) $r->subtotal,
                    'total'                 => (float) $r->total,
                ];
            }
        }

        return Inertia::render('Reports/InvoiceReport', [
            'rows'         => $rows,
            'enterprises'  => $enterprises,
            'enterpriseId' => $enterpriseId,
            'startDate'    => $start,
            'endDate'      => $end,
        ]);
    }

    public function invoiceExport(Request $request)
    {
        $start = $request->query('start_date') ?? session('reports.invoice.start_date');
        $end   = $request->query('end_date') ?? session('reports.invoice.end_date');

        validator(['start_date' => $start, 'end_date' => $end], [
            'start_date' => ['required', 'date'],
            'end_date'   => ['required', 'date', 'after_or_equal:start_date'],
        ])->validate();

        $enterpriseId = $request->query('enterprise_id')
            ?? session('reports.invoice.enterprise_id')
            ?? auth()->user()->enterprise_id;

        if (!$this->canChooseAnyEnterprise()) $enterpriseId = auth()->user()->enterprise_id;

        $fileName = sprintf(
            'reporte_facturacion_%s_%s_emp%s.xlsx',
            Carbon::parse($start)->format('Ymd'),
            Carbon::parse($end)->format('Ymd'),
            $enterpriseId === 'all' ? 'TODAS' : $enterpriseId
        );

        return Excel::download(new InvoiceReportExport($start, $end, (string) $enterpriseId), $fileName);
    }

    /* =======================
       IBC (resumen)
       ======================= */
    public function ibcManifestIndex(Request $request)
    {
        $start        = $request->query('start_date');
        $end          = $request->query('end_date');
        $enterpriseId = $request->query('enterprise_id'); // 'all' o id
        $enterprises  = $this->getVisibleEnterprises();

        $rows = [];

        if ($enterpriseId && $start && $end) {
            if (!$this->canChooseAnyEnterprise()) {
                $enterpriseId = (string) auth()->user()->enterprise_id;
            }

            session([
                'reports.ibc.enterprise_id' => $enterpriseId,
                'reports.ibc.start_date'    => $start,
                'reports.ibc.end_date'      => $end,
            ]);

            $query = Reception::with(['sender', 'recipient', 'packages'])
                ->where('annulled', false)
                ->whereDate('date_time', '>=', $start)
                ->whereDate('date_time', '<=', $end);

            if ($enterpriseId !== 'all') {
                $query->where('enterprise_id', $enterpriseId);
            } else {
                $coavproIds = Enterprise::where('commercial_name', 'COAVPRO')->pluck('id')->toArray();
                if (!empty($coavproIds)) $query->whereNotIn('enterprise_id', $coavproIds);
            }

            $receptions = $query->orderBy('enterprise_id')->orderByDesc('date_time')->get();

            foreach ($receptions as $reception) {
                foreach ($reception->packages as $package) {
                    $rows[] = [
                        'hawb'             => explode('.', $package->barcode)[0] ?? $package->barcode,
                        'shipper_name'     => optional($reception->sender)->full_name ?? '',
                        'consignee_person' => optional($reception->recipient)->full_name ?? '',
                        'weight'           => $package->weight ?? '',
                    ];
                }
            }
        }

        return Inertia::render('Reports/IBCManifestReport', [
            'startDate'    => $start,
            'endDate'      => $end,
            'enterpriseId' => $enterpriseId,
            'rows'         => $rows,
            'enterprises'  => $enterprises,
        ]);
    }

    public function ibcManifestExport(Request $request)
    {
        $start = $request->query('start_date') ?? session('reports.ibc.start_date');
        $end   = $request->query('end_date')   ?? session('reports.ibc.end_date');

        validator(['start_date' => $start, 'end_date' => $end], [
            'start_date' => ['required', 'date'],
            'end_date'   => ['required', 'date', 'after_or_equal:start_date'],
        ])->validate();

        $enterpriseId = $request->query('enterprise_id')
            ?? session('reports.ibc.enterprise_id')
            ?? (string) auth()->user()->enterprise_id;

        if (!$this->canChooseAnyEnterprise()) {
            $enterpriseId = (string) auth()->user()->enterprise_id;
        }

        $fileName = sprintf(
            'manifiesto_ibc_%s_%s_emp%s.xlsx',
            Carbon::parse($start)->format('Ymd'),
            Carbon::parse($end)->format('Ymd'),
            $enterpriseId === 'all' ? 'TODAS' : $enterpriseId
        );

        return Excel::download(new IBCManifestExport($start, $end, (string) $enterpriseId), $fileName);
    }

    public function ibcManifestExportCsv(Request $request)
    {
        $start = $request->query('start_date') ?? session('reports.ibc.start_date');
        $end   = $request->query('end_date')   ?? session('reports.ibc.end_date');

        validator(['start_date' => $start, 'end_date' => $end], [
            'start_date' => ['required', 'date'],
            'end_date'   => ['required', 'date', 'after_or_equal:start_date'],
        ])->validate();

        $enterpriseId = $request->query('enterprise_id')
            ?? session('reports.ibc.enterprise_id')
            ?? (string) auth()->user()->enterprise_id;

        if (!$this->canChooseAnyEnterprise()) {
            $enterpriseId = (string) auth()->user()->enterprise_id;
        }

        $fileName = sprintf(
            'manifiesto_ibc_%s_%s_emp%s.csv',
            Carbon::parse($start)->format('Ymd'),
            Carbon::parse($end)->format('Ymd'),
            $enterpriseId === 'all' ? 'TODAS' : $enterpriseId
        );

        return Excel::download(
            new \App\Exports\IBCManifestCsvExport($start, $end, (string) $enterpriseId),
            $fileName,
            \Maatwebsite\Excel\Excel::CSV
        );
    }

    /* =======================
       Airline (ARREGLADO)
       ======================= */
    public function airlineManifestIndex(Request $request)
    {
        $enterprises  = $this->getVisibleEnterprises();
        $start        = $request->query('start_date');
        $end          = $request->query('end_date');
        $enterpriseId = $request->query('enterprise_id'); // puede ser 'all' o id

        // Si el usuario no puede elegir, forzar su empresa
        if (!$this->canChooseAnyEnterprise()) {
            $enterpriseId = (string) auth()->user()->enterprise_id;
        }

        $rows = [];
        if ($start && $end && $enterpriseId) {
            $query = Reception::with(['sender', 'recipient', 'agencyDest', 'packages.items.artPackage'])
                ->where('annulled', false)
                ->whereDate('date_time', '>=', $start)
                ->whereDate('date_time', '<=', $end);

            if ($enterpriseId !== 'all') {
                $query->where('enterprise_id', $enterpriseId);
            } else {
                $coavproIds = Enterprise::where('commercial_name', 'COAVPRO')->pluck('id')->toArray();
                if (!empty($coavproIds)) $query->whereNotIn('enterprise_id', $coavproIds);
            }

            $receptions = $query->orderBy('enterprise_id')->orderByDesc('date_time')->get();

            foreach ($receptions as $reception) {
                foreach ($reception->packages as $package) {
                    $contents = $package->items->map(fn($item) => $item->artPackage?->name)->filter()->implode(', ');
                    $rows[] = [
                        'barcode'     => $package->barcode,
                        'shipper'     => $reception->sender->full_name ?? '',
                        'consignee'   => $reception->recipient->full_name ?? '',
                        'weight'      => $package->kilograms,
                        'envelope'    => $package->service_type === 'SOBRE' ? 1 : 0,
                        'paq'         => $package->service_type === 'PAQUETE' ? 1 : 0,
                        'bag'         => 0,
                        'destination' => $reception->agencyDest->name ?? '',
                        'contents'    => $contents,
                        'notes'       => '',
                    ];
                }
            }
        }

        return Inertia::render('Reports/AirlineManifestReport', [
            'enterprises'  => $enterprises,
            'startDate'    => $start,
            'endDate'      => $end,
            'enterpriseId' => $enterpriseId,
            'rows'         => $rows,
        ]);
    }

    public function airlineManifestExport(Request $request)
    {
        $start = $request->input('start_date');
        $end   = $request->input('end_date');

        $request->validate([
            'start_date' => ['required', 'date'],
            'end_date'   => ['required', 'date', 'after_or_equal:start_date'],
        ]);

        $enterpriseId = $request->input('enterprise_id') ?? (string) auth()->user()->enterprise_id;

        if (!$this->canChooseAnyEnterprise()) {
            $enterpriseId = (string) auth()->user()->enterprise_id;
        }

        $fileName = sprintf(
            'airline_manifest_%s_%s_emp%s.xlsx',
            Carbon::parse($start)->format('Ymd'),
            Carbon::parse($end)->format('Ymd'),
            $enterpriseId === 'all' ? 'TODAS' : $enterpriseId
        );

        return Excel::download(
            new AirlineManifestExport($start, $end, (string) $enterpriseId),
            $fileName
        );
    }

    /* =======================
       ACAS (sin cambios)
       ======================= */
    public function acasAviancaManifestIndex(Request $request)
    {
        $start        = $request->query('start_date');
        $end          = $request->query('end_date');
        $enterpriseId = $request->query('enterprise_id'); // puede ser 'all' o id

        $enterprises = $this->getVisibleEnterprises();
        $rows = [];

        // Si el usuario NO puede elegir empresa, forzar la suya
        if (!$this->canChooseAnyEnterprise()) {
            $enterpriseId = (string) auth()->user()->enterprise_id;
        }

        if ($enterpriseId && $start && $end) {
            session([
                'reports.acas.enterprise_id' => $enterpriseId,
                'reports.acas.start_date'    => $start,
                'reports.acas.end_date'      => $end,
            ]);

            $query = Reception::with(['sender', 'recipient', 'packages.items.artPackage'])
                ->where('annulled', false)
                ->whereDate('date_time', '>=', $start)
                ->whereDate('date_time', '<=', $end);

            if ($enterpriseId !== 'all') {
                $query->where('enterprise_id', $enterpriseId);
            } else {
                $coavproIds = Enterprise::where('commercial_name', 'COAVPRO')->pluck('id')->toArray();
                if (!empty($coavproIds)) $query->whereNotIn('enterprise_id', $coavproIds);
            }

            $receptions = $query->orderBy('enterprise_id')->orderByDesc('date_time')->get();

            // Agrupar como el export: por HAWB base
            $grouped = [];
            foreach ($receptions as $reception) {
                foreach ($reception->packages as $package) {
                    $baseCode = \Illuminate\Support\Str::before((string) ($package->barcode ?? ''), '.');

                    if (!isset($grouped[$baseCode])) {
                        $grouped[$baseCode] = [
                            'hawb'        => $baseCode,
                            'origin'      => 'GYE',
                            'destination' => 'JFK',
                            'pieces'      => 0,
                            'weight'      => 0.0,
                        ];
                    }
                    $grouped[$baseCode]['pieces'] += 1;
                    $grouped[$baseCode]['weight'] += (float) ($package->kilograms ?? 0);
                }
            }

            $rows = array_values($grouped);
        }

        return Inertia::render('Reports/ACASAviancaManifestReport', [
            'enterprises'  => $enterprises,
            'startDate'    => $start,
            'endDate'      => $end,
            'enterpriseId' => $enterpriseId,
            'rows'         => $rows,
        ]);
    }

    public function acasAviancaManifestExport(Request $request)
    {
        $start = $request->query('start_date') ?? session('reports.acas.start_date');
        $end   = $request->query('end_date')   ?? session('reports.acas.end_date');

        validator(['start_date' => $start, 'end_date' => $end], [
            'start_date' => ['required', 'date'],
            'end_date'   => ['required', 'date', 'after_or_equal:start_date'],
        ])->validate();

        $enterpriseId = $request->query('enterprise_id')
            ?? session('reports.acas.enterprise_id')
            ?? (string) auth()->user()->enterprise_id;

        if (!$this->canChooseAnyEnterprise()) {
            $enterpriseId = (string) auth()->user()->enterprise_id;
        }

        $fileName = sprintf(
            'acas_avianca_manifest_%s_%s_emp%s.xlsx',
            \Carbon\Carbon::parse($start)->format('Ymd'),
            \Carbon\Carbon::parse($end)->format('Ymd'),
            $enterpriseId === 'all' ? 'TODAS' : $enterpriseId
        );

        return \Maatwebsite\Excel\Facades\Excel::download(
            new ACASAviancaManifestExport($start, $end, $enterpriseId),
            $fileName
        );
    }
}
