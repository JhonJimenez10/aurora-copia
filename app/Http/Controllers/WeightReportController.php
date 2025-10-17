<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Exports\WeightReportExport;
use Maatwebsite\Excel\Facades\Excel;

class WeightReportController extends Controller
{
    public function index(Request $request)
    {
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');


        $weights = DB::table('receptions')
            ->join('agencies_dest', 'receptions.agency_dest', '=', 'agencies_dest.id')
            ->join('packages', 'receptions.id', '=', 'packages.reception_id')
            ->select(
                'receptions.agency_origin as agencia_origen',
                DB::raw('SUM(packages.pounds) as total_libras'),
                DB::raw('SUM(packages.kilograms) as total_kilos'),
                DB::raw('STRING_AGG(DISTINCT receptions.route, \', \') as rutas') // lista de destinos si usas PostgreSQL
            )
            ->where('receptions.annulled', 0)
            ->when($startDate, fn($q) => $q->whereDate('receptions.date_time', '>=', $startDate))
            ->when($endDate, fn($q) => $q->whereDate('receptions.date_time', '<=', $endDate))
            ->groupBy('receptions.agency_origin')
            ->orderBy('receptions.agency_origin')
            ->get();


        return Inertia::render('Reports/WeightReport', [
            'rows' => $weights,
            'startDate' => $startDate,
            'endDate' => $endDate,
        ]);
    }

    public function export(Request $request)
    {
        $startDate = $request->input('start_date');
        $endDate   = $request->input('end_date');

        $filename = 'Reporte_Pesos_' . now()->format('Ymd_His') . '.xlsx';

        return Excel::download(new WeightReportExport($startDate, $endDate), $filename);
    }
}
