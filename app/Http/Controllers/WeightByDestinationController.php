<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\Enterprise;
use App\Models\AgencyDest;
use App\Exports\WeightByDestinationExport;
use Maatwebsite\Excel\Facades\Excel;
use Carbon\Carbon;

class WeightByDestinationController extends Controller
{
    /* ===== Helpers de rol ===== */
    protected function roleUpper(): string
    {
        $u = auth()->user();
        if (!$u) return '';
        if (isset($u->role) && is_object($u->role) && isset($u->role->name)) return strtoupper((string) $u->role->name);
        if (isset($u->role_name) && is_string($u->role_name)) return strtoupper($u->role_name);
        if (isset($u->role) && is_string($u->role)) return strtoupper($u->role);
        return '';
    }

    /**
     * ✅ Este reporte es exclusivo de Admin/Sudo. Si por alguna razón un
     * usuario con otro rol llega hasta aquí (por ejemplo, cambios futuros
     * en el middleware), se corta con 403 en vez de dejarlo pasar.
     */
    protected function ensureAdminOrSudo(): void
    {
        if (!in_array($this->roleUpper(), ['SUDO', 'ADMIN'], true)) {
            abort(403, 'No tienes permiso para ver este reporte.');
        }
    }

    protected function getVisibleEnterprises()
    {
        return Enterprise::select('id', 'name', 'commercial_name')
            ->where('commercial_name', '!=', 'COAVPRO')
            ->orderBy('name')
            ->get();
    }

    /**
     * Agencias destino visibles para el combo de filtro. Si se eligió una
     * empresa puntual, solo las agencias destino de esa empresa; si es
     * "Todas", las de todas las empresas visibles (excluyendo COAVPRO).
     */
    protected function getVisibleDestinationAgencies(string $enterpriseFilter)
    {
        $query = AgencyDest::select('id', 'name', 'enterprise_id');

        if ($enterpriseFilter !== 'all') {
            $query->where('enterprise_id', $enterpriseFilter);
        } else {
            $coavproIds = Enterprise::where('commercial_name', 'COAVPRO')->pluck('id');
            $query->whereNotIn('enterprise_id', $coavproIds);
        }

        return $query->orderBy('name')->get();
    }

    /* =================== Vista =================== */
    public function index(Request $request)
    {
        $this->ensureAdminOrSudo();

        $startDate    = (string) $request->query('start_date', '');
        $endDate      = (string) $request->query('end_date', '');
        $enterpriseId = (string) $request->query('enterprise_id', 'all') ?: 'all';
        $agencyDestId = (string) $request->query('agency_dest_id', 'all') ?: 'all';

        $enterprises          = $this->getVisibleEnterprises();
        $destinationAgencies  = $this->getVisibleDestinationAgencies($enterpriseId);

        $rows = [];

        if ($startDate && $endDate) {
            $q = DB::table('receptions')
                ->join('packages', 'receptions.id', '=', 'packages.reception_id')
                ->join('enterprises', 'receptions.enterprise_id', '=', 'enterprises.id')
                ->leftJoin('agencies_dest', 'receptions.agency_dest', '=', 'agencies_dest.id')
                ->select(
                    'enterprises.id as enterprise_id',
                    'enterprises.name as enterprise_name',
                    'agencies_dest.id as agency_dest_id',
                    'agencies_dest.name as agencia_destino',
                    DB::raw('SUM(packages.pounds)    AS total_libras'),
                    DB::raw('SUM(packages.kilograms) AS total_kilos'),
                    DB::raw('STRING_AGG(DISTINCT receptions.route, \', \') AS rutas')
                )
                ->where('receptions.annulled', 0)
                ->whereDate('receptions.date_time', '>=', $startDate)
                ->whereDate('receptions.date_time', '<=', $endDate);

            if ($enterpriseId === 'all') {
                $q->where('enterprises.commercial_name', '!=', 'COAVPRO');
            } else {
                $q->where('receptions.enterprise_id', $enterpriseId);
            }

            if ($agencyDestId !== 'all') {
                $q->where('receptions.agency_dest', $agencyDestId);
            }

            // ✅ CLAVE: Agrupar por empresa Y agencia DESTINO
            $rows = $q->groupBy(
                'enterprises.id',
                'enterprises.name',
                'agencies_dest.id',
                'agencies_dest.name'
            )
                ->orderBy('agencia_destino')
                ->orderBy('enterprises.name')
                ->get();
        }

        return Inertia::render('Reports/WeightReportByDestination', [
            'rows'                => $rows,
            'startDate'           => $startDate,
            'endDate'             => $endDate,
            'enterprises'         => $enterprises,
            'destinationAgencies' => $destinationAgencies,
            'enterpriseId'        => $enterpriseId,
            'agencyDestId'        => $agencyDestId,
        ]);
    }

    /* =================== Export =================== */
    public function export(Request $request)
    {
        $this->ensureAdminOrSudo();

        $startDate    = (string) ($request->query('start_date') ?? '');
        $endDate      = (string) ($request->query('end_date')   ?? '');
        $enterpriseId = (string) ($request->query('enterprise_id') ?? '') ?: 'all';
        $agencyDestId = (string) ($request->query('agency_dest_id') ?? '') ?: 'all';

        validator(['start_date' => $startDate, 'end_date' => $endDate], [
            'start_date' => ['required', 'date'],
            'end_date'   => ['required', 'date', 'after_or_equal:start_date'],
        ])->validate();

        $fileName = sprintf(
            'Reporte_Pesos_Destino_%s_%s_emp%s_ag%s.xlsx',
            Carbon::parse($startDate)->format('Ymd'),
            Carbon::parse($endDate)->format('Ymd'),
            $enterpriseId === 'all' ? 'TODAS' : $enterpriseId,
            $agencyDestId === 'all' ? 'TODAS' : $agencyDestId
        );

        return Excel::download(
            new WeightByDestinationExport($startDate, $endDate, $enterpriseId, $agencyDestId),
            $fileName
        );
    }
}