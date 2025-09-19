<?php

namespace App\Http\Controllers;

use App\Models\Reception;
use App\Models\Enterprise;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\ReceptionsExport;
use Carbon\Carbon;
use App\Exports\InvoiceReportExport;
use App\Exports\IBCManifestExport;
use App\Exports\AirlineManifestExport;
use App\Exports\ACASAviancaManifestExport;

class ReportController extends Controller
{
    /** Rol en MAYÚSCULAS sin depender de roles() */
    /** Rol en MAYÚSCULAS sin depender de roles() */
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

    /** Helper: obtener empresas visibles según rol */
    protected function getVisibleEnterprises()
    {
        return Enterprise::select('id', 'name')
            ->when(!$this->canChooseAnyEnterprise(), fn($q) => $q->where('id', auth()->user()->enterprise_id))
            ->orderBy('name')
            ->get();
    }

    public function index(Request $request)
    {
        $start        = $request->query('start_date');
        $end          = $request->query('end_date');
        $enterpriseId = $request->query('enterprise_id');

        // Empresas para el selector:
        $enterprises = $this->getVisibleEnterprises();


        $receptions = [];

        // No cargar datos hasta tener empresa + fechas
        if ($enterpriseId && $start && $end) {
            // Si el rol NO puede elegir cualquiera (p. ej. CUSTOMER), forzar su empresa
            if (! $this->canChooseAnyEnterprise()) {
                $enterpriseId = auth()->user()->enterprise_id;
            }

            // Guardar filtros para export
            session([
                'reports.enterprise_id' => (int)$enterpriseId,
                'reports.start_date'    => $start,
                'reports.end_date'      => $end,
            ]);

            $receptions = Reception::with(['sender', 'recipient', 'packages.artPackage'])
                ->where('enterprise_id', $enterpriseId)
                ->whereDate('date_time', '>=', $start)
                ->whereDate('date_time', '<=', $end)
                ->get();
        }

        return Inertia::render('Reports/Index', [
            'enterprises'  => $enterprises,
            'receptions'   => $receptions,
            'enterpriseId' => $enterpriseId,
            'startDate'    => $start,
            'endDate'      => $end,
        ]);
    }

    /**
     * Exportar a Excel (GET)
     * - Fechas: toma query o sesión (valida siempre)
     * - Empresa: ADMIN y SUDO pueden elegir cualquiera; otros, la suya
     */
    public function export(Request $request)
    {
        // Fechas desde query o sesión (para mantener el flujo “antes”)
        $start = $request->query('start_date') ?? session('reports.start_date');
        $end   = $request->query('end_date')   ?? session('reports.end_date');

        validator(['start_date' => $start, 'end_date' => $end], [
            'start_date' => ['required', 'date'],
            'end_date'   => ['required', 'date', 'after_or_equal:start_date'],
        ])->validate();

        // Empresa efectiva
        $enterpriseId = $request->query('enterprise_id')
            ?? session('reports.enterprise_id')
            ?? auth()->user()->enterprise_id;

        if (! $this->canChooseAnyEnterprise()) {
            // CUSTOMER (u otros): solo su empresa
            $enterpriseId = auth()->user()->enterprise_id;
        }

        $fileName = sprintf(
            'envios_%s_%s_emp%s.xlsx',
            Carbon::parse($start)->format('Ymd'),
            Carbon::parse($end)->format('Ymd'),
            $enterpriseId
        );

        return Excel::download(new ReceptionsExport($start, $end, (string)$enterpriseId), $fileName);
    }

    /** Reporte Facturación (igual a tu versión) */
    public function invoiceIndex(Request $request)
    {
        $start = $request->input('start_date');
        $end   = $request->input('end_date');
        $enterpriseId = auth()->user()->enterprise_id ?? session('enterprise_id');

        $rows = [];

        if ($start && $end && $enterpriseId) {
            $receptions = Reception::with(['recipient'])
                ->where('enterprise_id', $enterpriseId)
                ->where('annulled', false)
                ->whereDate('date_time', '>=', $start)
                ->whereDate('date_time', '<=', $end)
                ->orderByDesc('date_time')
                ->get();

            foreach ($receptions as $r) {
                $rows[] = [
                    'numero_recepcion' => $r->number ?? '',
                    'destinatario'     => optional($r->recipient)->full_name ?? '',
                    'subtotal'         => (float) $r->subtotal,
                    'total'            => (float) $r->total,
                ];
            }
        }

        return Inertia::render('Reports/InvoiceReport', [
            'rows'      => $rows,
            'startDate' => $start,
            'endDate'   => $end,
        ]);
    }

    public function invoiceExport(Request $request)
    {
        $request->validate([
            'start_date' => ['required', 'date'],
            'end_date'   => ['required', 'date', 'after_or_equal:start_date'],
        ]);

        $enterpriseId = auth()->user()->enterprise_id ?? session('enterprise_id');
        abort_unless($enterpriseId, 403, 'Falta enterprise_id');

        $start = $request->input('start_date');
        $end   = $request->input('end_date');

        $fileName = sprintf(
            'reporte_factura_%s_a_%s.xlsx',
            Carbon::parse($start)->format('Ymd'),
            Carbon::parse($end)->format('Ymd')
        );

        return Excel::download(new InvoiceReportExport($start, $end, $enterpriseId), $fileName);
    }
    public function ibcManifestIndex(Request $request)
    {
        $start = $request->query('start_date');
        $end   = $request->query('end_date');
        $enterpriseId = $request->query('enterprise_id');
        $enterprises = $this->getVisibleEnterprises();

        $rows = [];

        if ($enterpriseId && $start && $end) {
            if (! $this->canChooseAnyEnterprise()) {
                $enterpriseId = auth()->user()->enterprise_id;
            }

            // Guardar filtros en sesión para exportación
            session([
                'reports.ibc.enterprise_id' => (int)$enterpriseId,
                'reports.ibc.start_date'    => $start,
                'reports.ibc.end_date'      => $end,
            ]);

            // 🔹 Cargar datos de recepciones
            $receptions = Reception::with(['sender', 'recipient', 'packages'])
                ->where('enterprise_id', $enterpriseId)
                ->where('annulled', false)
                ->whereDate('date_time', '>=', $start)
                ->whereDate('date_time', '<=', $end)
                ->get();

            foreach ($receptions as $reception) {
                foreach ($reception->packages as $package) {
                    $rows[] = [
                        'hawb'            => explode('.', $package->barcode)[0] ?? $package->barcode,
                        'shipper_name'    => optional($reception->sender)->full_name ?? '',
                        'consignee_person' => optional($reception->recipient)->full_name ?? '',
                        'weight'          => $package->weight ?? '',
                    ];
                }
            }
        }

        return Inertia::render('Reports/IBCManifestReport', [
            'startDate'    => $start,
            'endDate'      => $end,
            'enterpriseId' => $enterpriseId,
            'rows'         => $rows, // 👈 Ahora enviamos datos reales
            'enterprises'  => $enterprises, // <-- listado de empresas

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
            ?? auth()->user()->enterprise_id;

        if (! $this->canChooseAnyEnterprise()) {
            $enterpriseId = auth()->user()->enterprise_id;
        }

        $fileName = sprintf(
            'manifiesto_ibc_%s_%s_emp%s.xlsx',
            \Carbon\Carbon::parse($start)->format('Ymd'),
            \Carbon\Carbon::parse($end)->format('Ymd'),
            $enterpriseId
        );

        return \Maatwebsite\Excel\Facades\Excel::download(
            new IBCManifestExport($start, $end, (string) $enterpriseId),
            $fileName
        );
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
            ?? auth()->user()->enterprise_id;

        if (! $this->canChooseAnyEnterprise()) {
            $enterpriseId = auth()->user()->enterprise_id;
        }

        $fileName = sprintf(
            'manifiesto_ibc_%s_%s_emp%s.csv',
            \Carbon\Carbon::parse($start)->format('Ymd'),
            \Carbon\Carbon::parse($end)->format('Ymd'),
            $enterpriseId
        );

        return \Maatwebsite\Excel\Facades\Excel::download(
            new \App\Exports\IBCManifestCsvExport($start, $end, (string) $enterpriseId),
            $fileName,
            \Maatwebsite\Excel\Excel::CSV
        );
    }
    public function airlineManifestExport(Request $request)
    {
        // Tomar fechas desde request
        $startDate = $request->input('start_date');
        $endDate   = $request->input('end_date');

        // Validar fechas
        $request->validate([
            'start_date' => ['required', 'date'],
            'end_date'   => ['required', 'date', 'after_or_equal:start_date'],
        ]);

        // Normalizar fechas para incluir todo el día
        $start = Carbon::parse($startDate)->startOfDay();
        $end   = Carbon::parse($endDate)->endOfDay();

        // Determinar empresa
        $enterpriseId = $request->input('enterprise_id') ?? auth()->user()->enterprise_id;

        // Si el usuario NO puede elegir empresa, forzar la suya
        if (! $this->canChooseAnyEnterprise()) {
            $enterpriseId = auth()->user()->enterprise_id;
        }

        // Nombre de archivo
        $fileName = sprintf(
            'airline_manifest_%s_%s_emp%s.xlsx',
            $start->format('Ymd'),
            $end->format('Ymd'),
            $enterpriseId
        );

        // Exportar Excel
        return Excel::download(
            new AirlineManifestExport($start, $end, (string) $enterpriseId),
            $fileName
        );
    }

    public function airlineManifestIndex(Request $request)
    {
        $enterprises = $this->getVisibleEnterprises();
        $start = $request->query('start_date');
        $end   = $request->query('end_date');
        $enterpriseId = $request->query('enterprise_id', auth()->user()->enterprise_id);

        if (!$this->canChooseAnyEnterprise()) {
            $enterpriseId = auth()->user()->enterprise_id;
        }

        $rows = [];
        if ($start && $end && $enterpriseId) {
            $receptions = Reception::with(['sender', 'recipient', 'agencyDest', 'packages.items.artPackage'])
                ->where('enterprise_id', $enterpriseId)
                ->whereDate('date_time', '>=', $start)
                ->whereDate('date_time', '<=', $end)
                ->get();

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
    public function acasAviancaManifestIndex(Request $request)
    {
        $start = $request->query('start_date');
        $end   = $request->query('end_date');
        $enterpriseId = $request->query('enterprise_id') ?? auth()->user()->enterprise_id;

        $enterprises = $this->getVisibleEnterprises();
        $rows = [];

        if ($enterpriseId && $start && $end) {
            if (!$this->canChooseAnyEnterprise()) {
                $enterpriseId = auth()->user()->enterprise_id;
            }

            session([
                'reports.acas.enterprise_id' => $enterpriseId,
                'reports.acas.start_date'    => $start,
                'reports.acas.end_date'      => $end,
            ]);

            $receptions = Reception::with(['sender', 'recipient', 'packages.items.artPackage'])
                ->where('enterprise_id', $enterpriseId)
                ->whereDate('date_time', '>=', $start)
                ->whereDate('date_time', '<=', $end)
                ->get();

            foreach ($receptions as $reception) {
                foreach ($reception->packages as $package) {
                    $contents = $package->items->map(fn($item) => $item->artPackage?->name)->filter()->implode(', ');

                    $rows[] = [
                        'hawb'              => $package->barcode,
                        'origin'            => 'GYE',
                        'destination'       => 'JFK',
                        'pieces'            => 1,
                        'weight'            => $package->kilograms,
                        'shipper_name'      => optional($reception->sender)->full_name ?? '',
                        'shipper_address'   => optional($reception->sender)->address ?? '',
                        'shipper_city'      => optional($reception->sender)->city ?? '',
                        'shipper_state'     => 'EC',
                        'shipper_country'   => 'EC',
                        'shipper_postal'    => optional($reception->sender)->postal_code ?? '',
                        'consignee_name'    => optional($reception->recipient)->full_name ?? '',
                        'consignee_address' => optional($reception->recipient)->address ?? '',
                        'consignee_city'    => optional($reception->recipient)->city ?? '',
                        'consignee_state'   => optional($reception->recipient)->state ?? '',
                        'consignee_country' => 'US',
                        'consignee_postal'  => optional($reception->recipient)->postal_code ?? '',
                        'contents'          => $contents,
                    ];
                }
            }
        }

        return Inertia::render('Reports/ACASAviancaManifestReport', [
            'enterprises' => Enterprise::select('id', 'name')->get(), // 👈 Enviar lista de empresas
            'startDate'    => $start,
            'endDate'      => $end,
            'enterpriseId' => $enterpriseId,
            'rows'         => $rows,
        ]);
    }


    public function acasAviancaManifestExport(Request $request)
    {
        $start = $request->query('start_date') ?? session('reports.acas.start_date');
        $end   = $request->query('end_date') ?? session('reports.acas.end_date');

        validator(['start_date' => $start, 'end_date' => $end], [
            'start_date' => ['required', 'date'],
            'end_date'   => ['required', 'date', 'after_or_equal:start_date'],
        ])->validate();

        $enterpriseId = $request->query('enterprise_id');

        if (empty($enterpriseId) || $enterpriseId === 'null') {
            $enterpriseId = session('reports.acas.enterprise_id') ?? auth()->user()->enterprise_id;
        }

        if (! $this->canChooseAnyEnterprise()) {
            $enterpriseId = auth()->user()->enterprise_id;
        }


        $fileName = sprintf(
            'acas_avianca_manifest_%s_%s_emp%s.xlsx',
            Carbon::parse($start)->format('Ymd'),
            Carbon::parse($end)->format('Ymd'),
            $enterpriseId
        );

        return Excel::download(
            new ACASAviancaManifestExport($start, $end, $enterpriseId),
            $fileName
        );
    }
}
