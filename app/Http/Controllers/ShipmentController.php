<?php

namespace App\Http\Controllers;

use App\Models\Shipment;
use App\Models\Reception;
use App\Models\AgencyDest;
use App\Exports\ShipmentManifestExport;
use App\Exports\ShipmentManifestCsvExport;
use App\Exports\ShipmentReceptionsExport;
use App\Exports\ShipmentAcasAviancaManifestExport;
use App\Exports\ShipmentAirlineManifestExport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Illuminate\Validation\Rule;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Excel as ExcelFormat;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;

class ShipmentController extends Controller
{
    /** Nombres de mes en español, usados para formatear fechas en los reportes. */
    private const MESES_ES = [
        1 => 'enero', 2 => 'febrero', 3 => 'marzo', 4 => 'abril',
        5 => 'mayo', 6 => 'junio', 7 => 'julio', 8 => 'agosto',
        9 => 'septiembre', 10 => 'octubre', 11 => 'noviembre', 12 => 'diciembre',
    ];

    // -------------------------------------------------------
    // INDEX
    // -------------------------------------------------------
    public function index(Request $request)
    {
        $enterpriseId = auth()->user()->enterprise_id;

        $shipments = Shipment::where('enterprise_id', $enterpriseId)
            ->when($request->filled('from') && $request->filled('to'), function ($q) use ($request) {
                $q->whereBetween('date', [$request->from, $request->to]);
            })
            ->when($request->filled('number'), function ($q) use ($request) {
                $q->where('number', 'like', '%' . $request->number . '%');
            })
            ->when($request->filled('status'), function ($q) use ($request) {
                $q->where('status', $request->status);
            })
            ->with(['creator'])
            ->orderByDesc('date')
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString();

        $enterprise = \App\Models\Enterprise::find($enterpriseId);

        $last = Shipment::where('enterprise_id', $enterpriseId)
            ->orderByDesc('created_at')->first();
        $nextSeq = 1;
        if ($last && preg_match('/(\d+)$/', $last->number, $m)) {
            $nextSeq = (int) $m[1] + 1;
        }
        $nextNumber = 'EMB-' . str_pad($nextSeq, 6, '0', STR_PAD_LEFT);

        return Inertia::render('Shipment/Index', [
            'shipments'  => $shipments,
            'filters'    => $request->only(['from', 'to', 'number', 'status']),
            'nextNumber' => $nextNumber,
            'enterprise' => $enterprise ? ['agency_origin' => $enterprise->city ?? $enterprise->name] : null,
        ]);
    }

    // -------------------------------------------------------
    // CREATE
    // -------------------------------------------------------
    public function create()
    {
        $enterpriseId = auth()->user()->enterprise_id;
        $enterprise   = \App\Models\Enterprise::find($enterpriseId);

        $last = Shipment::where('enterprise_id', $enterpriseId)
            ->orderByDesc('created_at')
            ->first();

        $nextSeq = 1;
        if ($last && preg_match('/(\d+)$/', $last->number, $m)) {
            $nextSeq = (int) $m[1] + 1;
        }
        $nextNumber = 'EMB-' . str_pad($nextSeq, 6, '0', STR_PAD_LEFT);

        return Inertia::render('Shipment/Create', [
            'nextNumber' => $nextNumber,
            'enterprise' => $enterprise ? [
                'agency_origin' => $enterprise->city ?? $enterprise->name,
            ] : null,
        ]);
    }

    // -------------------------------------------------------
    // STORE  — Inertia espera redirect, no JSON
    // -------------------------------------------------------
    public function store(Request $request)
    {
        $enterpriseId = auth()->user()->enterprise_id;

        $request->validate([
            'date'           => 'required|date',
            'country_origin' => 'required|string|max:100',
            'agency_origin'  => 'required|string|max:100',
            // ✅ "Sin prefijo" está permitido: nullable
            'sack_prefix'    => 'nullable|string|max:20',
            'route'          => 'required|string|max:255',
            'airline'        => 'required|string|max:100',
            'number'         => [
                'required',
                'string',
                'max:30',
                Rule::unique('shipments')->where(
                    fn($q) => $q->where('enterprise_id', $enterpriseId)
                ),
            ],
            'airport_origin' => 'required|string|max:100',
            'airport_dest'   => 'required|string|max:100',
            'cargo_agency'   => 'nullable|string|max:100',
            'palletizer'     => 'nullable|string|max:100',
            'open'           => 'boolean',
        ]);

        try {
            $shipment = Shipment::create([
                'enterprise_id'  => $enterpriseId,
                'date'           => $request->date,
                'country_origin' => $request->country_origin,
                'agency_origin'  => $request->agency_origin,
                // ✅ strtoupper protegido: si viene vacío/null (Sin prefijo),
                // no truena y guarda null en vez de forzar un string vacío raro
                'sack_prefix'    => $request->sack_prefix ? strtoupper($request->sack_prefix) : null,
                'route'          => $request->route,
                'airline'        => $request->airline,
                'number'         => $request->number,
                'airport_origin' => $request->airport_origin,
                'airport_dest'   => $request->airport_dest,
                'cargo_agency'   => $request->cargo_agency,
                'palletizer'     => $request->palletizer,
                'open'           => $request->boolean('open', true),
                'status'         => $request->boolean('open', true) ? 'OPEN' : 'CLOSED',
                'created_by'     => auth()->id(),
            ]);

            return response()->json([
                'message' => 'Embarque creado correctamente.',
                'id'      => $shipment->id,
                'number'  => $shipment->number,
            ], 201);
        } catch (\Throwable $e) {
            Log::error('Error al crear embarque: ' . $e->getMessage());
            return response()->json([
                'error'   => 'Error interno al guardar el embarque.',
                'details' => ['number' => ['Error interno al guardar el embarque.']],
            ], 500);
        }
    }

    // -------------------------------------------------------
    // SHOW (JSON para uso interno si se necesita)
    // -------------------------------------------------------
    public function show($id)
    {
        $enterpriseId = auth()->user()->enterprise_id;
        $shipment = Shipment::where('enterprise_id', $enterpriseId)
            ->with(['creator', 'closer'])
            ->findOrFail($id);

        return response()->json($shipment);
    }

    // -------------------------------------------------------
    // EDIT
    // -------------------------------------------------------
    public function edit($id)
    {
        $enterpriseId = auth()->user()->enterprise_id;
        $shipment = Shipment::where('enterprise_id', $enterpriseId)->findOrFail($id);

        return Inertia::render('Shipment/Edit', [
            'shipment' => $shipment,
        ]);
    }

    // -------------------------------------------------------
    // UPDATE  — Inertia espera redirect, no JSON
    // -------------------------------------------------------
    public function update(Request $request, $id)
    {
        $enterpriseId = auth()->user()->enterprise_id;
        $shipment = Shipment::where('enterprise_id', $enterpriseId)->findOrFail($id);

        if ($shipment->status === 'CANCELLED') {
            return back()->withErrors(['number' => 'No se puede modificar un embarque cancelado.']);
        }

        $request->validate([
            'date'           => 'sometimes|required|date',
            'country_origin' => 'sometimes|required|string|max:100',
            'agency_origin'  => 'sometimes|required|string|max:100',
            // ✅ CAMBIO: antes era "sometimes|required", bloqueaba "Sin prefijo".
            // Ahora es nullable, igual que en store().
            'sack_prefix'    => 'nullable|string|max:20',
            'route'          => 'sometimes|required|string|max:255',
            'airline'        => 'sometimes|required|string|max:100',
            'number'         => [
                'sometimes', 'required', 'string', 'max:30',
                Rule::unique('shipments')
                    ->where(fn($q) => $q->where('enterprise_id', $enterpriseId))
                    ->ignore($shipment->id),
            ],
            'airport_origin' => 'sometimes|required|string|max:100',
            'airport_dest'   => 'sometimes|required|string|max:100',
            'cargo_agency'   => 'nullable|string|max:100',
            'palletizer'     => 'nullable|string|max:100',
            'open'           => 'boolean',
        ]);

        $data = $request->only([
            'date', 'country_origin', 'agency_origin', 'sack_prefix',
            'route', 'airline', 'number', 'airport_origin', 'airport_dest',
            'cargo_agency', 'palletizer', 'open',
        ]);

        if (array_key_exists('sack_prefix', $data)) {
            // ✅ strtoupper protegido igual que en store()
            $data['sack_prefix'] = $data['sack_prefix'] ? strtoupper($data['sack_prefix']) : null;
        }

        if (array_key_exists('open', $data)) {
            $data['status'] = $data['open'] ? 'OPEN' : 'CLOSED';
            if (!$data['open'] && $shipment->open) {
                $data['closed_by'] = auth()->id();
                $data['closed_at'] = now();
            }
        }

        $shipment->update($data);

        return redirect()->route('shipments.index')
            ->with('success', 'Embarque actualizado correctamente.');
    }

    // -------------------------------------------------------
    // DESTROY
    // -------------------------------------------------------
    public function destroy($id)
    {
        $enterpriseId = auth()->user()->enterprise_id;
        $shipment = Shipment::where('enterprise_id', $enterpriseId)->findOrFail($id);

        if ($shipment->status === 'CLOSED') {
            return back()->withErrors(['number' => 'No se puede eliminar un embarque cerrado.']);
        }

        $shipment->delete();

        return redirect()->route('shipments.index')
            ->with('success', 'Embarque eliminado correctamente.');
    }

    // -------------------------------------------------------
    // CANCEL
    // -------------------------------------------------------
    public function cancel($id)
    {
        $enterpriseId = auth()->user()->enterprise_id;
        $shipment = Shipment::where('enterprise_id', $enterpriseId)->findOrFail($id);

        if ($shipment->status === 'CANCELLED') {
            return redirect()->route('shipments.index');
        }

        $shipment->update([
            'status'    => 'CANCELLED',
            'open'      => false,
            'closed_by' => auth()->id(),
            'closed_at' => now(),
        ]);

        return redirect()->route('shipments.index')
            ->with('success', 'Embarque cancelado correctamente.');
    }

    // -------------------------------------------------------
    // NEXT NUMBER (API JSON)
    // -------------------------------------------------------
    public function nextNumber()
    {
        $enterpriseId = auth()->user()->enterprise_id;

        $last = Shipment::where('enterprise_id', $enterpriseId)
            ->orderByDesc('created_at')
            ->first();

        $nextSeq = 1;
        if ($last && preg_match('/(\d+)$/', $last->number, $m)) {
            $nextSeq = (int) $m[1] + 1;
        }

        return response()->json([
            'number' => 'EMB-' . str_pad($nextSeq, 6, '0', STR_PAD_LEFT),
        ]);
    }

    // -------------------------------------------------------
    // MANIFIESTO EXCEL — solo paquetes de este embarque
    // -------------------------------------------------------
    public function manifestExport($id)
    {
        $enterpriseId = auth()->user()->enterprise_id;
        $shipment = Shipment::where('enterprise_id', $enterpriseId)->findOrFail($id);

        return Excel::download(
            new ShipmentManifestExport((string) $shipment->id),
            "manifiesto-embarque-{$shipment->number}.xlsx"
        );
    }

    // -------------------------------------------------------
    // MANIFIESTO CSV — solo paquetes de este embarque
    // -------------------------------------------------------
    public function manifestExportCsv($id)
    {
        $enterpriseId = auth()->user()->enterprise_id;
        $shipment = Shipment::where('enterprise_id', $enterpriseId)->findOrFail($id);

        return Excel::download(
            new ShipmentManifestCsvExport((string) $shipment->id),
            "manifiesto-embarque-{$shipment->number}.csv",
            ExcelFormat::CSV
        );
    }

    // -------------------------------------------------------
    // REPORTE DE RECEPCIONES EXCEL — solo paquetes de este embarque
    // -------------------------------------------------------
    public function receptionsExport($id)
    {
        $enterpriseId = auth()->user()->enterprise_id;
        $shipment = Shipment::where('enterprise_id', $enterpriseId)->findOrFail($id);

        return Excel::download(
            new ShipmentReceptionsExport((string) $shipment->id),
            "recepciones-embarque-{$shipment->number}.xlsx"
        );
    }

    // -------------------------------------------------------
    // MANIFIESTO ACAS AVIANCA — solo paquetes de este embarque,
    // con columna SACA (número real de saca asignado en el embarque)
    // -------------------------------------------------------
    public function acasManifestExport($id)
    {
        $enterpriseId = auth()->user()->enterprise_id;
        $shipment = Shipment::where('enterprise_id', $enterpriseId)->findOrFail($id);

        return Excel::download(
            new ShipmentAcasAviancaManifestExport((string) $shipment->id),
            "acas-avianca-embarque-{$shipment->number}.xlsx"
        );
    }

    // -------------------------------------------------------
    // REPORTE DE SACAS (Airline Manifest con columna BAG) —
    // solo paquetes de este embarque, con el número real de saca en BAG
    // -------------------------------------------------------
    public function airlineManifestExport($id)
    {
        $enterpriseId = auth()->user()->enterprise_id;
        $shipment = Shipment::where('enterprise_id', $enterpriseId)->findOrFail($id);

        return Excel::download(
            new ShipmentAirlineManifestExport((string) $shipment->id),
            "reporte-sacas-embarque-{$shipment->number}.xlsx"
        );
    }

    // -------------------------------------------------------
    // ✅ NUEVO: LISTADO PARA ENTREGAS (PDF) — solo paquetes de este
    // embarque que van a la agencia destino seleccionada. Mismo formato
    // que el "Listado para entregas" que ya usa la empresa.
    // -------------------------------------------------------
    public function deliveryListPdf(Request $request, $id)
    {
        $enterpriseId = auth()->user()->enterprise_id;
        $shipment = Shipment::where('enterprise_id', $enterpriseId)->findOrFail($id);

        $request->validate([
            'agency_dest_id' => 'required|uuid|exists:agencies_dest,id',
        ]);

        $agencyDestId = $request->query('agency_dest_id');
        $agencyDest   = AgencyDest::find($agencyDestId);

        // Paquetes asignados a alguna saca de ESTE embarque.
        $packageIds = DB::table('shipment_sack_packages')
            ->join('shipment_sacks', 'shipment_sacks.id', '=', 'shipment_sack_packages.shipment_sack_id')
            ->where('shipment_sacks.shipment_id', $shipment->id)
            ->pluck('shipment_sack_packages.package_id')
            ->all();

        $rows = collect();

        if (!empty($packageIds)) {
            // Solo recepciones cuya agencia destino sea la seleccionada, y
            // dentro de ellas, solo los paquetes que pertenecen a este embarque.
            $receptions = Reception::with([
                    'sender',
                    'recipient',
                    'packages' => function ($q) use ($packageIds) {
                        $q->whereIn('id', $packageIds);
                    },
                    'packages.items.artPackage',
                ])
                ->where('agency_dest', $agencyDestId)
                ->whereHas('packages', function ($q) use ($packageIds) {
                    $q->whereIn('id', $packageIds);
                })
                ->orderBy('agency_origin')
                ->orderBy('date_time')
                ->get();

            foreach ($receptions as $reception) {
                foreach ($reception->packages as $package) {
                    $description = $package->items
                        ->map(fn($item) => $item->artPackage?->translation ?: $item->artPackage?->name)
                        ->filter()
                        ->implode(' ');

                    $rows->push([
                        'code'          => explode('.', (string) ($package->barcode ?? ''))[0] ?? '',
                        'agency_origin' => $reception->agency_origin ?? '',
                        'sender'        => optional($reception->sender)->full_name ?? '',
                        'recipient'     => optional($reception->recipient)->full_name ?? '',
                        'phone'         => optional($reception->recipient)->phone ?? '',
                        'pounds'        => (float) ($package->pounds ?? 0),
                        'pieces'        => 1,
                        'content'       => $description,
                    ]);
                }
            }
        }

        // Número de embarque formateado con espacios (ej. "729 9121 5401"),
        // igual a como lo maneja el listado original.
        $digitsOnly = preg_replace('/\D/', '', (string) ($shipment->number ?? ''));
        if (strlen($digitsOnly) === 11) {
            $formattedNumber = substr($digitsOnly, 0, 3) . ' ' . substr($digitsOnly, 3, 4) . ' ' . substr($digitsOnly, 7, 4);
        } else {
            $formattedNumber = $shipment->number ?? '';
        }

        $fechaEmbarque = $shipment->date
            ? $this->formatFechaEs(Carbon::parse($shipment->date))
            : '';

        $elaboradoEl = $this->formatFechaEs(now()) . ' ' . now()->format('H:i:s');

        $pdf = Pdf::loadView('pdfs.shipment_delivery_list', [
            'formattedNumber' => $formattedNumber,
            'agencyName'      => $agencyDest->name ?? '',
            'fechaEmbarque'   => $fechaEmbarque,
            'elaboradoEl'     => $elaboradoEl,
            'rows'            => $rows,
        ]);

        $agencyLabel = str_replace(' ', '_', $agencyDest->name ?? 'agencia');
        $fileName    = "listado-entregas-{$shipment->number}-{$agencyLabel}.pdf";

        return $pdf->stream($fileName);
    }

    /** Formatea una fecha como "15-agosto-2026", igual al listado original. */
    private function formatFechaEs(Carbon $date): string
    {
        return sprintf('%02d-%s-%d', $date->day, self::MESES_ES[$date->month], $date->year);
    }
}