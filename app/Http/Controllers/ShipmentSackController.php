<?php

namespace App\Http\Controllers;

use App\Models\Shipment;
use App\Models\ShipmentSack;
use App\Models\TransferSack;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ShipmentSackController extends Controller
{
    /**
     * Obtener sacas confirmadas disponibles para asignar a un embarque.
     * "Confirmadas" = transfer_sack_packages.confirmed = true
     * "Disponibles" = no están ya asignadas a otro embarque
     */
    public function availableSacks(Request $request)
    {
        $enterpriseId = auth()->user()->enterprise_id;

        $assignedSackIds = ShipmentSack::pluck('transfer_sack_id')->toArray();

        $sacks = TransferSack::whereHas('transfer', function ($q) use ($enterpriseId) {
                $q->where('enterprise_id', $enterpriseId);
            })
            ->whereHas('sackPackages', function ($q) {
                $q->where('confirmed', true);
            })
            ->whereNotIn('id', $assignedSackIds)
            ->with([
                'transfer:id,number,from_city,to_city',
                'sackPackages' => function ($q) {
                    $q->where('confirmed', true)
                      ->with(['package:id,barcode,content,service_type,pounds,kilograms']);
                },
            ])
            ->get()
            ->map(function ($sack) {
                $confirmedPkgs = $sack->sackPackages;
                return [
                    'id'              => $sack->id,
                    'sack_number'     => $sack->sack_number, // número original del traslado (referencia)
                    'seal'            => $sack->seal,
                    'refrigerated'    => $sack->refrigerated,
                    'transfer_id'     => $sack->transfer_id,
                    'transfer_number' => $sack->transfer->number ?? '—',
                    'from_city'       => $sack->transfer->from_city ?? '—',
                    'to_city'         => $sack->transfer->to_city ?? '—',
                    'packages_count'  => $confirmedPkgs->count(),
                    'pounds_total'    => $confirmedPkgs->sum('pounds'),
                    'kilograms_total' => $confirmedPkgs->sum('kilograms'),
                    'packages'        => $confirmedPkgs->map(fn($sp) => [
                        'id'           => $sp->package->id ?? $sp->package_id,
                        'barcode'      => $sp->package->barcode ?? '—',
                        'content'      => $sp->package->content ?? '—',
                        'service_type' => $sp->package->service_type ?? '—',
                        'pounds'       => $sp->pounds,
                        'kilograms'    => $sp->kilograms,
                    ])->values(),
                ];
            });

        return response()->json($sacks);
    }

    /**
     * Obtener sacas ya asignadas a un embarque específico.
     * Usa el sack_number MANUAL guardado en shipment_sacks (no el del traslado).
     */
    public function sacksForShipment($shipmentId)
    {
        $enterpriseId = auth()->user()->enterprise_id;

        $shipment = Shipment::where('enterprise_id', $enterpriseId)
            ->findOrFail($shipmentId);

        $sacks = ShipmentSack::where('shipment_id', $shipmentId)
            ->with([
                'transferSack.transfer:id,number,from_city,to_city',
                'transferSack.sackPackages' => function ($q) {
                    $q->where('confirmed', true)
                      ->with(['package:id,barcode,content,service_type,pounds,kilograms']);
                },
            ])
            ->orderBy('sack_number')
            ->get()
            ->map(function ($ss) {
                $sack = $ss->transferSack;
                $pkgs = $sack->sackPackages;
                return [
                    'shipment_sack_id' => $ss->id,
                    'id'               => $sack->id,
                    // ✅ Número manual ingresado por el operador, NO el del traslado
                    'sack_number'      => $ss->sack_number ?? $sack->sack_number,
                    'seal'             => $sack->seal,
                    'refrigerated'     => $sack->refrigerated,
                    'transfer_number'  => $sack->transfer->number ?? '—',
                    'from_city'        => $sack->transfer->from_city ?? '—',
                    'to_city'          => $sack->transfer->to_city ?? '—',
                    'packages_count'   => $ss->packages_count,
                    'pounds_total'     => $ss->pounds_total,
                    'kilograms_total'  => $ss->kilograms_total,
                    'packages'         => $pkgs->map(fn($sp) => [
                        'id'           => $sp->package->id ?? $sp->package_id,
                        'barcode'      => $sp->package->barcode ?? '—',
                        'content'      => $sp->package->content ?? '—',
                        'service_type' => $sp->package->service_type ?? '—',
                        'pounds'       => $sp->pounds,
                        'kilograms'    => $sp->kilograms,
                    ])->values(),
                ];
            });

        return response()->json([
            'shipment' => [
                'id'     => $shipment->id,
                'number' => $shipment->number,
                'route'  => $shipment->route,
            ],
            'sacks' => $sacks,
        ]);
    }

    /**
     * Asignar sacas a un embarque, con número de saca manual.
     */
    public function assignSacks(Request $request, $shipmentId)
    {
        $enterpriseId = auth()->user()->enterprise_id;

        $shipment = Shipment::where('enterprise_id', $enterpriseId)
            ->findOrFail($shipmentId);

        if ($shipment->status === 'CANCELLED') {
            return response()->json(['error' => 'No se puede modificar un embarque cancelado.'], 409);
        }

        $request->validate([
            'sack_ids'    => 'required|array|min:1',
            'sack_ids.*'  => 'required|uuid|exists:transfer_sacks,id',
            'sack_number' => 'required|string|max:20',
        ]);

        DB::beginTransaction();
        try {
            foreach ($request->sack_ids as $sackId) {
                $alreadyAssigned = ShipmentSack::where('transfer_sack_id', $sackId)->exists();
                if ($alreadyAssigned) {
                    continue;
                }

                $sack = TransferSack::with(['sackPackages' => function ($q) {
                    $q->where('confirmed', true);
                }])->findOrFail($sackId);

                $confirmedPkgs = $sack->sackPackages;

                ShipmentSack::create([
                    'shipment_id'      => $shipmentId,
                    'transfer_sack_id' => $sackId,
                    'sack_number'      => $request->sack_number, // ✅ número manual del operador
                    'packages_count'   => $confirmedPkgs->count(),
                    'pounds_total'     => $confirmedPkgs->sum('pounds'),
                    'kilograms_total'  => $confirmedPkgs->sum('kilograms'),
                ]);
            }

            DB::commit();
            return response()->json(['message' => 'Sacas asignadas correctamente.']);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Error asignando sacas al embarque: ' . $e->getMessage());
            return response()->json(['error' => 'Error al asignar sacas.', 'details' => $e->getMessage()], 500);
        }
    }

    /**
     * Remover una saca de un embarque.
     */
    public function removeSack($shipmentId, $shipmentSackId)
    {
        $enterpriseId = auth()->user()->enterprise_id;

        $shipment = Shipment::where('enterprise_id', $enterpriseId)
            ->findOrFail($shipmentId);

        if ($shipment->status === 'CANCELLED') {
            return response()->json(['error' => 'No se puede modificar un embarque cancelado.'], 409);
        }

        ShipmentSack::where('shipment_id', $shipmentId)
            ->where('id', $shipmentSackId)
            ->delete();

        return response()->json(['message' => 'Saca removida del embarque.']);
    }
}