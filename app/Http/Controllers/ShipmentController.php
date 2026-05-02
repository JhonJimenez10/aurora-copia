<?php

namespace App\Http\Controllers;

use App\Models\Shipment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Illuminate\Validation\Rule;

class ShipmentController extends Controller
{
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

        return Inertia::render('Shipment/Index', [
            'shipments' => $shipments,
            'filters'   => $request->only(['from', 'to', 'number', 'status']),
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
            'sack_prefix'    => 'required|string|max:20',
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
            Shipment::create([
                'enterprise_id'  => $enterpriseId,
                'date'           => $request->date,
                'country_origin' => $request->country_origin,
                'agency_origin'  => $request->agency_origin,
                'sack_prefix'    => strtoupper($request->sack_prefix),
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

            return redirect()->route('shipments.index')
                ->with('success', 'Embarque creado correctamente.');
        } catch (\Throwable $e) {
            Log::error('Error al crear embarque: ' . $e->getMessage());
            return back()->withErrors(['number' => 'Error interno al guardar el embarque.']);
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
            'sack_prefix'    => 'sometimes|required|string|max:20',
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
            $data['sack_prefix'] = strtoupper($data['sack_prefix']);
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
}