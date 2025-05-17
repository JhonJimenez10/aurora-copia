<?php

namespace App\Http\Controllers;

use App\Models\Reception;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\ReceptionsExport;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $start = $request->query('start_date');
        $end   = $request->query('end_date');
        $receptions = [];

        if ($start && $end) {
            $receptions = Reception::with(['sender', 'recipient', 'packages.artPackage'])
                ->whereDate('date_time', '>=', $start)
                ->whereDate('date_time', '<=', $end)
                ->get();
        }

        return Inertia::render('Reports/Index', [
            'receptions' => $receptions,
            'startDate'  => $start,
            'endDate'    => $end,
        ]);
    }

    public function export(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date'   => 'required|date',
        ]);

        $start = $request->start_date;
        $end   = $request->end_date;

        return Excel::download(
            new ReceptionsExport($start, $end),
            "envios_{$start}_{$end}.xlsx"
        );
    }
}
