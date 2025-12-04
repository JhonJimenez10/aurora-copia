<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\Enterprise;
use App\Exports\WeightReportExport;
use Maatwebsite\Excel\Facades\Excel;
use Carbon\Carbon;

class WeightReportController extends Controller
{
    /* ===== Helpers de rol (igual estilo a tus otros controladores) ===== */
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
        // Para ADMIN/SUDO mostramos todas menos COAVPRO (como en facturación)
        // Para otros, solo su empresa
        return Enterprise::select('id', 'name', 'commercial_name')
            ->when(!$this->canChooseAnyEnterprise(), fn($q) => $q->where('id', auth()->user()->enterprise_id))
            ->when($this->canChooseAnyEnterprise(), fn($q) => $q->where('commercial_name', '!=', 'COAVPRO'))
            ->orderBy('name')
            ->get();
    }

    /* =================== Vista =================== */
    public function index(Request $request)
    {
        $startDate    = (string) $request->query('start_date', '');
        $endDate      = (string) $request->query('end_date', '');
        $enterpriseId = $request->query('enterprise_id'); // 'all' o id

        $enterprises = $this->getVisibleEnterprises();

        // Valor por defecto del combo:
        if (!$enterpriseId) {
            $enterpriseId = $this->canChooseAnyEnterprise()
                ? 'all' // Admin/Sudo: por defecto "Todos (excepto COAVPRO)"
                : (string) auth()->user()->enterprise_id;
        }

        $rows = [];

        if ($startDate && $endDate) {
            $q = DB::table('receptions')
                ->join('packages', 'receptions.id', '=', 'packages.reception_id')
                ->join('enterprises', 'receptions.enterprise_id', '=', 'enterprises.id')
                ->select(
                    'receptions.agency_origin as agencia_origen',
                    DB::raw('SUM(packages.pounds)    AS total_libras'),
                    DB::raw('SUM(packages.kilograms) AS total_kilos'),
                    DB::raw('STRING_AGG(DISTINCT receptions.route, \', \') AS rutas')
                )
                ->where('receptions.annulled', 0)
                ->whereDate('receptions.date_time', '>=', $startDate)
                ->whereDate('receptions.date_time', '<=', $endDate);

            // Filtro por empresa
            if (!$this->canChooseAnyEnterprise()) {
                // fuerza su empresa
                $enterpriseId = (string) auth()->user()->enterprise_id;
                $q->where('receptions.enterprise_id', $enterpriseId);
            } else {
                if ($enterpriseId === 'all') {
                    $q->where('enterprises.commercial_name', '!=', 'COAVPRO');
                } else {
                    $q->where('receptions.enterprise_id', $enterpriseId);
                }
            }

            $rows = $q->groupBy('receptions.agency_origin')
                ->orderBy('receptions.agency_origin')
                ->get();
        }

        return Inertia::render('Reports/WeightReport', [
            'rows'         => $rows,
            'startDate'    => $startDate,
            'endDate'      => $endDate,
            'enterprises'  => $enterprises,
            'enterpriseId' => (string) $enterpriseId,
        ]);
    }

    /* =================== Export =================== */
    public function export(Request $request)
    {
        $startDate    = (string) ($request->query('start_date') ?? '');
        $endDate      = (string) ($request->query('end_date')   ?? '');
        $enterpriseId = (string) ($request->query('enterprise_id') ?? '');

        // Validación simple
        validator(['start_date' => $startDate, 'end_date' => $endDate], [
            'start_date' => ['required', 'date'],
            'end_date'   => ['required', 'date', 'after_or_equal:start_date'],
        ])->validate();

        if (!$this->canChooseAnyEnterprise()) {
            $enterpriseId = (string) auth()->user()->enterprise_id;
        } elseif ($enterpriseId === '') {
            $enterpriseId = 'all';
        }

        $fileName = sprintf(
            'Reporte_Pesos_%s_%s_emp%s.xlsx',
            Carbon::parse($startDate)->format('Ymd'),
            Carbon::parse($endDate)->format('Ymd'),
            $enterpriseId === 'all' ? 'TODAS' : $enterpriseId
        );

        return Excel::download(
            new WeightReportExport($startDate, $endDate, (string) $enterpriseId),
            $fileName
        );
    }
}
