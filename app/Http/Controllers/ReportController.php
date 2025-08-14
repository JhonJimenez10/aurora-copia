<?php

namespace App\Http\Controllers;

use App\Models\Reception;
use App\Models\Enterprise;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\ReceptionsExport;
use Carbon\Carbon;

class ReportController extends Controller
{
    // ===== Helpers de rol (sin roles()) =====
    protected function currentRoleName(): string
    {
        $user = auth()->user();
        if (! $user) return '';

        // 1) relación role->name
        if (isset($user->role) && is_object($user->role) && isset($user->role->name)) {
            return strtoupper((string) $user->role->name);
        }
        // 2) columna role_name
        if (isset($user->role_name) && is_string($user->role_name)) {
            return strtoupper($user->role_name);
        }
        // 3) columna role como string
        if (isset($user->role) && is_string($user->role)) {
            return strtoupper($user->role);
        }
        return '';
    }

    protected function ensureAdminOrSudo(): void
    {
        $role = $this->currentRoleName();
        abort_unless(in_array($role, ['ADMIN', 'SUDO']), 403, 'No autorizado');
    }

    // ====== MANIFIESTO en /reports (empresa + fechas) ======
    public function index(Request $request)
    {
        $this->ensureAdminOrSudo();

        $enterpriseId = $request->query('enterprise_id');
        $start        = $request->query('start_date');
        $end          = $request->query('end_date');

        // Empresas para el selector
        if ($this->currentRoleName() === 'SUDO') {
            $enterprises = Enterprise::select('id', 'name')->orderBy('name')->get();
        } else {
            // ADMIN: normalmente solo su empresa
            $enterprises = Enterprise::select('id', 'name')
                ->where('id', auth()->user()->enterprise_id)
                ->get();
        }

        $receptions = [];

        // NO cargar nada hasta tener empresa + fechas
        if ($enterpriseId && $start && $end) {
            // Si es ADMIN, fuerza a su propia empresa
            if ($this->currentRoleName() === 'ADMIN' && (int)$enterpriseId !== (int)auth()->user()->enterprise_id) {
                abort(403, 'No autorizado');
            }

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

    public function export(Request $request)
    {
        $this->ensureAdminOrSudo();

        $request->validate([
            'enterprise_id' => ['required', 'integer', 'exists:enterprises,id'],
            'start_date'    => ['required', 'date'],
            'end_date'      => ['required', 'date', 'after_or_equal:start_date'],
        ]);

        $enterpriseId = (int)$request->input('enterprise_id');
        $start        = $request->input('start_date');
        $end          = $request->input('end_date');

        // Si es ADMIN, solo su empresa
        if ($this->currentRoleName() === 'ADMIN' && $enterpriseId !== (int)auth()->user()->enterprise_id) {
            abort(403, 'No autorizado');
        }

        $fileName = sprintf(
            'manifiesto_emp%s_%s_a_%s.xlsx',
            $enterpriseId,
            Carbon::parse($start)->format('Ymd'),
            Carbon::parse($end)->format('Ymd')
        );

        return Excel::download(new ReceptionsExport($start, $end, (string)$enterpriseId), $fileName);
    }

    // ===== Tus reportes de facturación (sin cambios) =====
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

        return Excel::download(new \App\Exports\InvoiceReportExport($start, $end, $enterpriseId), $fileName);
    }
}
