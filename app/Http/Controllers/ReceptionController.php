<?php

namespace App\Http\Controllers;

use App\Models\Additional;
use App\Models\Package;
use App\Models\PackageItem;
use App\Models\Reception;
use App\Models\Sender;
use App\Models\Recipient;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Milon\Barcode\Facades\DNS1DFacade;
use App\Models\AgencyDest;
use Illuminate\Validation\Rule;

class ReceptionController extends Controller
{
    public function index(Request $request)
    {
        $enterpriseId = auth()->user()->enterprise_id;

        $receptions = Reception::where('enterprise_id', $enterpriseId)
            ->when(
                $request->filled('from') && $request->filled('to'),
                fn($q) =>
                $q->whereBetween('date_time', [$request->from, $request->to])
            )
            ->when(
                $request->filled('number'),
                fn($q) =>
                $q->where('number', 'like', '%' . $request->number . '%')
            )
            ->with(['sender', 'recipient'])
            ->orderByDesc('date_time')
            ->paginate(10);

        return Inertia::render('Reception/Index', [
            'receptions' => $receptions,
            'filters' => $request->only(['from', 'to', 'number']),
        ]);
    }


    public function create()
    {
        return Inertia::render('Reception/Create', [
            'senders'    => Sender::all(['id', 'full_name']),
            'recipients' => Recipient::all(['id', 'full_name']),
        ]);
    }

    public function show($id)
    {
        $reception = Reception::with('packages')->findOrFail($id);
        return response()->json($reception);
    }

    public function getNextNumber(Request $request)
    {
        try {
            $enterpriseId = $request->query('enterprise_id') ?? auth()->user()?->enterprise_id;

            if (!$enterpriseId) {
                return response()->json(['error' => 'No se especificó una empresa válida.'], 400);
            }

            // 🔹 1) Buscar la recepción con el MAYOR number (no la última creada)
            $lastReception = Reception::where('enterprise_id', $enterpriseId)
                ->where('number', 'like', '%-%-%')   // aseguramos formato con 3 partes
                ->orderByDesc('number')              // 👈 AQUÍ el cambio importante
                ->first();

            $nextSequential = 1;

            // 🔹 2) Extraer la parte numérica final y sumar 1
            if ($lastReception && preg_match('/\d{3}-\d{3}-(\d{9})/', $lastReception->number, $matches)) {
                $lastSeq = (int) $matches[1];
                $nextSequential = $lastSeq + 1;
            }

            // 🔹 3) Siempre usamos el mismo prefijo por ahora: 001-001
            $formattedNumber = sprintf('001-001-%09d', $nextSequential);

            return response()->json(['number' => $formattedNumber]);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Error interno al generar el número',
                'message' => $e->getMessage(),
            ], 500);
        }
    }






    public function store(Request $request)
    {
        try {
            if (!auth()->check() || !auth()->user()->enterprise_id) {
                return response()->json([
                    'error' => 'Usuario no tiene empresa asignada o no está autenticado.'
                ], 400);
            }
            $enterpriseId = auth()->user()->enterprise_id;

            $validated = $request->validate([
                // Campos de la recepción
                'number' => [
                    'required',
                    'string',
                    'max:20',
                    Rule::unique('receptions')
                        ->where(fn($query) => $query->where('enterprise_id', $enterpriseId)),
                ],
                'route'         => 'required|string|max:255',
                'date_time'     => 'required|date',
                'agency_origin' => 'required|string|max:100',
                'agency_dest'   => 'required|string|max:100',
                'sender_id'     => 'required|uuid',
                'recipient_id'  => 'required|uuid',
                'pkg_total'     => 'required|numeric',
                'arancel'       => 'required|numeric',
                'ins_pkg'       => 'required|numeric',
                'packaging'     => 'required|numeric',
                'ship_ins'      => 'required|numeric',
                'clearance'     => 'required|numeric',
                'trans_dest'    => 'required|numeric',
                'transmit'      => 'required|numeric',
                'subtotal'      => 'required|numeric',
                'vat15'         => 'required|numeric',
                'total'         => 'required|numeric',
                'pay_method'    => 'nullable|string|max:50',
                'cash_recv'     => 'required|numeric',
                'change'        => 'required|numeric',

                // Paquetes
                'packages'                     => 'required|array',
                'packages.*.art_package_id'    => 'nullable|uuid',
                'packages.*.service_type'      => 'required|string|max:50',
                'packages.*.content'           => 'nullable|string|max:255',
                'packages.*.pounds'            => 'required|numeric',
                'packages.*.kilograms'         => 'required|numeric',
                'packages.*.total'             => 'required|numeric',
                'packages.*.decl_val'          => 'required|numeric',
                'packages.*.ins_val'           => 'required|numeric',
                'packages.*.perfumeDesc'       => 'nullable|string|max:255',
                'packages.*.items'             => 'nullable|array',

                // Adicionales (puede existir, pero no se validan sus campos)
                'additionals' => 'nullable|array',
            ]);
        } catch (\Illuminate\Validation\ValidationException $ve) {
            Log::error('❌ Error de validación al guardar recepción', [
                'errors' => $ve->errors(),
            ]);

            return response()->json([
                'error'   => 'Error de validación',
                'details' => $ve->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error('❌ Error inesperado al validar recepción: ' . $e->getMessage());

            return response()->json([
                'error' => 'Error interno al validar datos',
                'details' => $e->getMessage(),
            ], 500);
        }

        try {
            $sender = Sender::findOrFail($validated['sender_id']);

            $validated['id'] = Str::uuid();
            $validated['enterprise_id'] = auth()->user()->enterprise_id;
            $validated['arancel'] = $validated['arancel'] ?? 0;
            // === NUEVO: obtener provincia y ciudad reales de la empresa ===
            $enterprise = \App\Models\Enterprise::find($validated['enterprise_id']);
            $province = strtoupper(substr($enterprise->province ?? 'XX', 0, 2));
            $city     = strtoupper(substr($enterprise->city ?? 'XX', 0, 2));

            // Crear recepción
            $reception = Reception::create($validated);
            $lastDigits = substr($reception->number, -4);

            // === GENERAR PREFIJO DE CÓDIGO DE BARRAS ===
            $prefix = $province . $city;

            // Paquetes
            foreach ($validated['packages'] as $idx => $pkg) {
                $barcodeCode = $prefix . $lastDigits . '.' . ($idx + 1);

                $package = Package::create([
                    'reception_id'   => $reception->id,
                    'art_package_id' => $pkg['art_package_id'] ?? null,
                    'service_type'   => $pkg['service_type'],
                    'content'        => $pkg['content'] ?? null,
                    'pounds'         => $pkg['pounds'],
                    'kilograms'      => $pkg['kilograms'],
                    'total'          => $pkg['total'],
                    'decl_val'       => $pkg['decl_val'],
                    'ins_val'        => $pkg['ins_val'],
                    'barcode'        => $barcodeCode,
                    'perfumeDesc'    => $pkg['perfumeDesc'] ?? null,
                ]);

                if (!empty($pkg['items'])) {
                    foreach ($pkg['items'] as $item) {
                        PackageItem::create([
                            'package_id'     => $package->id,
                            'art_package_id' => $item['art_package_id'] ?? null,
                            'quantity'       => $item['quantity'] ?? 1,
                            'unit'           => $item['unit'] ?? 'UND',
                            'volume'         => $item['volume'] ?? false,
                            'length'         => $item['length'] ?? 0,
                            'width'          => $item['width'] ?? 0,
                            'height'         => $item['height'] ?? 0,
                            'weight'         => $item['weight'] ?? 0,
                            'pounds'         => $item['pounds'] ?? 0,
                            'kilograms'      => $item['kilograms'] ?? 0,
                            'unit_price'     => $item['unit_price'] ?? 0,
                            'total'          => $item['total'] ?? 0,
                            'items_declrd'   => $item['items_decl'] ?? 0,
                            'decl_val'       => $item['decl_val'] ?? 0,
                            'ins_val'        => $item['ins_val'] ?? 0,
                        ]);
                    }
                }
            }

            // Adicionales: solo guardar si están completos
            if (!empty($validated['additionals'])) {
                foreach ($validated['additionals'] as $add) {
                    if (
                        !empty($add['article']) &&
                        isset($add['quantity']) &&
                        isset($add['unit_price'])
                    ) {
                        Additional::create([
                            'id'           => Str::uuid(),
                            'reception_id' => $reception->id,
                            'art_packg_id' => $add['article'],
                            'quantity'     => $add['quantity'],
                            'unit_price'   => $add['unit_price'],
                            'total'        => $add['quantity'] * $add['unit_price'],
                        ]);
                    }
                }
            }

            return response()->json([
                'message' => 'Recepción guardada correctamente',
                'id'      => $reception->id,
            ], 201);
        } catch (\Throwable $e) {
            Log::error('❌ Error al guardar recepción: ' . $e->getMessage());

            return response()->json([
                'error'   => 'Error interno al guardar recepción',
                'details' => $e->getMessage(),
            ], 500);
        }
    }




    public function edit($id)
    {
        $reception = Reception::with([
            'sender',
            'recipient',
            'packages.packageItems.artPackage',
            'additionals.artPackg',
            'invoice'
        ])->findOrFail($id);

        return Inertia::render('Reception/Edit', [
            'initialData' => [
                'id' => $reception->id,
                'receptionNumber' => $reception->number,
                'receptionDate' => \Carbon\Carbon::parse($reception->date_time)->format('Y-m-d'), // ✅ FORMATO CORRECTO
                'route' => $reception->route,
                'agencyDest' => $reception->agency_dest,

                'sender' => [
                    'id' => $reception->sender->id,
                    'identification' => $reception->sender->identification ?? '',
                    'full_name' => $reception->sender->full_name ?? '',
                    'address' => $reception->sender->address ?? '',
                    'phone' => $reception->sender->phone ?? '',
                    'email' => $reception->sender->email ?? '',
                    'postal_code' => $reception->sender->postal_code ?? '',
                    'city' => $reception->sender->city ?? '',
                    'canton' => $reception->sender->canton ?? '',
                    'state' => $reception->sender->state ?? '',
                ],

                'recipient' => [
                    'id' => $reception->recipient->id,
                    'identification' => $reception->recipient->identification ?? '',
                    'full_name' => $reception->recipient->full_name ?? '',
                    'address' => $reception->recipient->address ?? '',
                    'phone' => $reception->recipient->phone ?? '',
                    'email' => $reception->recipient->email ?? '',
                    'postal_code' => $reception->recipient->postal_code ?? '',
                    'city' => $reception->recipient->city ?? '',
                    'canton' => $reception->recipient->canton ?? '',
                    'state' => $reception->recipient->state ?? '',
                ],

                'packages' => $reception->packages->map(function ($pkg) {
                    return [
                        'id' => $pkg->id,
                        'art_package_id' => $pkg->art_package_id,
                        'service_type' => $pkg->service_type,
                        'content' => $pkg->content,
                        'pounds' => (float) $pkg->pounds,
                        'kilograms' => (float) $pkg->kilograms,
                        'total' => (float) $pkg->total,
                        'decl_val' => (float) $pkg->decl_val,
                        'ins_val' => (float) $pkg->ins_val,
                        'perfumeDesc' => $pkg->perfumeDesc,
                        'items' => $pkg->packageItems->map(function ($item) {
                            return [
                                'art_package_id' => $item->art_package_id,
                                'name' => $item->artPackage->name ?? '',
                                'quantity' => (float) ($item->quantity ?? 0),
                                'unit' => $item->unit ?? 'UND',
                                'volume' => (bool) ($item->volume ?? false),
                                'length' => (float) ($item->length ?? 0),
                                'width' => (float) ($item->width ?? 0),
                                'height' => (float) ($item->height ?? 0),
                                'weight' => (float) ($item->weight ?? 0),
                                'pounds' => (float) ($item->pounds ?? 0),
                                'kilograms' => (float) ($item->kilograms ?? 0),
                                'unit_price' => (float) ($item->unit_price ?? 0),
                                'total' => (float) ($item->total ?? 0),
                                'items_decl' => (float) ($item->items_declrd ?? 0),
                                'decl_val' => (float) ($item->decl_val ?? 0),
                                'arancel' => (float) ($item->artPackage->arancel ?? 0),
                                'ins_val' => (float) ($item->ins_val ?? 0),
                            ];
                        })->toArray(),
                    ];
                })->toArray(),

                'additionals' => $reception->additionals->map(function ($add) {
                    return [
                        'quantity' => (float) ($add->quantity ?? 0),
                        'unit' => $add->artPackg->unit_type ?? '',
                        'article' => $add->art_packg_id,
                        'unit_price' => (float) ($add->unit_price ?? 0),
                    ];
                })->toArray(),

                'payMethod' => $reception->pay_method ?? 'EFECTIVO',
                'efectivoRecibido' => (float) ($reception->cash_recv ?? 0),
                'invoice_id' => $reception->invoice?->id,
                'annulled' => (bool) ($reception->annulled ?? false),
                'arancel' => (float) ($reception->arancel ?? 0),
            ],
            'readOnly' => true,
        ]);
    }

    public function update(Request $request, $id)
    {
        $reception = Reception::with(['sender', 'recipient', 'packages.packageItems'])->findOrFail($id);
        if ($reception->annulled) {
            return response()->json([
                'error' => 'No se puede modificar una recepción anulada.'
            ], 409);
        }

        $validated = $request->validate([
            'number'        => 'sometimes|required|string|max:20',
            'route'         => 'sometimes|required|string|max:255',
            'date_time'     => 'sometimes|required|date',
            'agency_origin' => 'sometimes|required|string|max:100',
            'agency_dest'   => 'sometimes|required|string|max:100',
            'sender_id'     => 'sometimes|required|uuid',
            'recipient_id'  => 'sometimes|required|uuid',
            'pkg_total'     => 'sometimes|required|numeric',
            'arancel'       => 'sometimes|required|numeric',
            'ins_pkg'       => 'sometimes|required|numeric',
            'packaging'     => 'sometimes|required|numeric',
            'ship_ins'      => 'sometimes|required|numeric',
            'clearance'     => 'sometimes|required|numeric',
            'trans_dest'    => 'sometimes|required|numeric',
            'transmit'      => 'sometimes|required|numeric',
            'subtotal'      => 'sometimes|required|numeric',
            'vat15'         => 'sometimes|required|numeric',
            'total'         => 'sometimes|required|numeric',
            'pay_method'    => 'nullable|string|max:50',
            'cash_recv'     => 'sometimes|required|numeric',
            'change'        => 'sometimes|required|numeric',
        ]);

        $reception->update($validated);
        return redirect()->route('receptions.index')
            ->with('success', 'Recepción actualizada correctamente.');
    }

    public function destroy($id)
    {
        $reception = Reception::findOrFail($id);
        $reception->delete();
        return redirect()->route('receptions.index')
            ->with('success', 'Recepción eliminada correctamente.');
    }

    public function generateAllPackageTicketsPdf($id)
    {
        $reception = Reception::with(['sender', 'recipient', 'packages.packageItems.artPackage'])
            ->findOrFail($id);

        // ← Validar si está anulada
        if ($reception->annulled) {
            abort(403, 'No se pueden generar tickets de una recepción anulada.');
        }

        $barcodes = [];
        foreach ($reception->packages as $package) {
            $barcodes[] = [
                'package' => $package,
                'barcode' => DNS1DFacade::getBarcodeHTML($package->barcode ?? 'NOCODE', 'C128', 2, 80),
            ];
        }

        $pdf = Pdf::loadView('pdfs.all_package_tickets', [
            'reception' => $reception,
            'barcodes'  => $barcodes,
        ]);

        return response($pdf->output(), 200)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'inline; filename="tickets-' . $reception->number . '.pdf"');
    }
    public function annul(Request $request, $id)
    {
        $enterpriseId = auth()->user()->enterprise_id;

        $reception = Reception::where('enterprise_id', $enterpriseId)->findOrFail($id);

        if ($reception->annulled) {
            return response()->json(['message' => 'La recepción ya está anulada.'], 200);
        }

        $reception->annulled = true;

        // opcional:
        if ($reception->isFillable('annulled_by')) {
            $reception->annulled_by = auth()->id();
        }
        if ($reception->isFillable('annulled_at')) {
            $reception->annulled_at = now();
        }

        $reception->save();

        return response()->json(['message' => 'Recepción anulada correctamente.']);
    }
}
