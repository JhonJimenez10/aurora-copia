<?php

namespace App\Http\Controllers;

use App\Models\Enterprise;
use App\Models\Shipment;
use App\Models\ShipmentSack;
use App\Models\ShipmentSackPackage;
use App\Models\TransferSack;
use App\Models\TransferSackPackage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ShipmentSackController extends Controller
{
    /**
     * ✅ Mismo criterio de admin usado en los otros controladores.
     */
    private function canViewAllEnterprises($user): bool
    {
        $roleName = $user->role->name ?? null;
        return in_array($roleName, ['Admin', 'Sudo'], true);
    }

    /**
     * GET /api/enterprises/list-filter (reutilizable, solo admin)
     */
    public function enterprisesList()
    {
        $user = auth()->user();

        if (!$this->canViewAllEnterprises($user)) {
            return response()->json([]);
        }

        return response()->json(
            Enterprise::orderBy('name')->get(['id', 'name', 'city'])
        );
    }

    /**
     * GET /api/shipments/available-sacks
     *
     * Devuelve la lista PLANA de paquetes confirmados que aún no están
     * asignados a ninguna saca de embarque.
     */
    public function availableSacks(Request $request)
    {
        $user = auth()->user();
        $isAdmin = $this->canViewAllEnterprises($user);
        $enterpriseId = $user->enterprise_id;

        $filterEnterpriseId = $request->input('enterprise_id');

        // Paquetes que YA están en alguna saca de embarque (no se repiten)
        $assignedPackageIds = ShipmentSackPackage::pluck('package_id')->toArray();

        $items = TransferSackPackage::where('confirmed', true)
            ->whereNotIn('package_id', $assignedPackageIds)
            ->whereHas('sack.transfer', function ($q) use ($isAdmin, $enterpriseId, $filterEnterpriseId) {
                // ✅ NUEVO: el traslado de origen debe seguir CONFIRMED. Si
                // por algún motivo quedó CANCELLED después de que algunos de
                // sus paquetes se marcaron confirmed=true, ya no debe salir
                // aquí como disponible para embarque.
                $q->where('status', 'CONFIRMED');

                if (!$isAdmin) {
                    $q->where('enterprise_id', $enterpriseId);
                } elseif (!empty($filterEnterpriseId)) {
                    $q->where('enterprise_id', $filterEnterpriseId);
                }
            })
            ->with([
                'sack:id,sack_number,transfer_id',
                'sack.transfer:id,number,from_city,to_city,enterprise_id',
                'package:id,reception_id,barcode,content,service_type',
                'package.reception:id,agency_dest',
                'package.reception.agencyDest:id,name',
            ])
            ->get()
            // ✅ NUEVO: salvaguarda extra — si por datos históricos un mismo
            // paquete quedó registrado en más de un transfer_sack_package
            // (bug ya corregido en el origen, ver TransferController), aquí
            // se deja solo UNA aparición por paquete para no mostrar
            // duplicados en pantalla.
            ->unique('package_id')
            ->values();

        $enterpriseIds = $items->pluck('sack.transfer.enterprise_id')->filter()->unique();
        $enterpriseNames = Enterprise::whereIn('id', $enterpriseIds)->pluck('name', 'id');

        $result = $items->map(function (TransferSackPackage $tsp) use ($enterpriseNames) {
            $enterpriseId = $tsp->sack->transfer->enterprise_id ?? null;

            return [
                'id'                    => $tsp->package_id,
                'transfer_sack_id'      => $tsp->transfer_sack_id,
                'barcode'               => $tsp->package->barcode ?? '—',
                'content'               => $tsp->package->content ?? '—',
                'service_type'          => $tsp->package->service_type ?? '—',
                'pounds'                => (float) $tsp->pounds,
                'kilograms'             => (float) $tsp->kilograms,
                'sack_number'           => $tsp->sack->sack_number ?? null,
                'transfer_number'       => $tsp->sack->transfer->number ?? '—',
                'from_city'             => $tsp->sack->transfer->from_city ?? '—',
                'to_city'               => $tsp->sack->transfer->to_city ?? '—',
                'enterprise_id'         => $enterpriseId,
                'enterprise_name'       => $enterpriseNames[$enterpriseId] ?? null,
                'destination_agency'    => $tsp->package?->reception?->agencyDest?->name,
                'destination_agency_id' => $tsp->package?->reception?->agencyDest?->id,
            ];
        })->values();

        return response()->json($result);
    }

    /**
     * GET /api/shipments/{shipment}/sacks
     */
    public function sacksForShipment($shipmentId)
    {
        $user = auth()->user();
        $isAdmin = $this->canViewAllEnterprises($user);

        $shipmentQuery = Shipment::query();
        if (!$isAdmin) {
            $shipmentQuery->where('enterprise_id', $user->enterprise_id);
        }
        $shipment = $shipmentQuery->findOrFail($shipmentId);

        $sacks = ShipmentSack::where('shipment_id', $shipmentId)
            ->with([
                'packages.package.reception.agencyDest',
                'packages.transferSack.transfer:id,number,from_city,to_city,enterprise_id',
            ])
            ->orderBy('created_at')
            ->get();

        $enterpriseIds = $sacks
            ->flatMap(fn($s) => $s->packages->pluck('transferSack.transfer.enterprise_id'))
            ->filter()->unique();
        $enterpriseNames = Enterprise::whereIn('id', $enterpriseIds)->pluck('name', 'id');

        $mapped = $sacks->map(function (ShipmentSack $sack) use ($enterpriseNames) {
            $pivots = $sack->packages;

            $destinationAgencies = $pivots
                ->map(fn($sp) => $sp->package?->reception?->agencyDest?->name)
                ->filter()->unique()->values();

            $firstTransfer = $pivots->first()?->transferSack?->transfer;

            return [
                'shipment_sack_id' => $sack->id,
                'id'               => $sack->id,
                'sack_number'      => $sack->sack_number,
                'from_city'        => $firstTransfer->from_city ?? '—',
                'to_city'          => $firstTransfer->to_city ?? '—',
                'transfer_number'  => $firstTransfer->number ?? '—',
                'packages_count'   => $pivots->count(),
                'pounds_total'     => $pivots->sum('pounds'),
                'kilograms_total'  => $pivots->sum('kilograms'),
                'destination_agencies' => $destinationAgencies->implode(', '),
                'packages'         => $pivots->map(function ($sp) use ($enterpriseNames) {
                    $enterpriseId = $sp->transferSack->transfer->enterprise_id ?? null;

                    return [
                        'id'                    => $sp->package_id,
                        'barcode'               => $sp->package->barcode ?? '—',
                        'content'               => $sp->package->content ?? '—',
                        'service_type'          => $sp->package->service_type ?? '—',
                        'pounds'                => $sp->pounds,
                        'kilograms'             => $sp->kilograms,
                        'transfer_sack_id'      => $sp->transfer_sack_id,
                        'transfer_number'       => $sp->transferSack->transfer->number ?? '—',
                        'destination_agency'    => $sp->package?->reception?->agencyDest?->name,
                        'destination_agency_id' => $sp->package?->reception?->agencyDest?->id,
                        'enterprise_id'         => $enterpriseId,
                        'enterprise_name'       => $enterpriseNames[$enterpriseId] ?? null,
                    ];
                })->values(),
            ];
        });

        return response()->json([
            'shipment' => [
                'id'     => $shipment->id,
                'number' => $shipment->number,
                'route'  => $shipment->route,
            ],
            'sacks' => $mapped,
        ]);
    }

    /**
     * POST /api/shipments/{shipment}/sacks
     */
    public function assignSacks(Request $request, $shipmentId)
    {
        $user = auth()->user();
        $isAdmin = $this->canViewAllEnterprises($user);

        $shipmentQuery = Shipment::query();
        if (!$isAdmin) {
            $shipmentQuery->where('enterprise_id', $user->enterprise_id);
        }
        $shipment = $shipmentQuery->findOrFail($shipmentId);

        if ($shipment->status === 'CANCELLED') {
            return response()->json(['error' => 'No se puede modificar un embarque cancelado.'], 409);
        }

        $request->validate([
            'sack_number'   => 'required|string|max:20',
            'package_ids'   => 'required|array|min:1',
            'package_ids.*' => 'required|uuid',
        ]);

        $packageIds = collect($request->package_ids)->unique()->values();

        $alreadyAssigned = ShipmentSackPackage::whereIn('package_id', $packageIds)->exists();
        if ($alreadyAssigned) {
            return response()->json([
                'error' => 'Uno o más paquetes ya fueron asignados a otra saca de embarque.',
            ], 409);
        }

        $items = TransferSackPackage::where('confirmed', true)
            ->whereIn('package_id', $packageIds)
            // ✅ NUEVO: mismo resguardo que en availableSacks() — el traslado
            // de origen debe seguir CONFIRMED.
            ->whereHas('sack.transfer', fn($q) => $q->where('status', 'CONFIRMED'))
            ->get()
            ->unique('package_id');

        if ($items->count() !== $packageIds->count()) {
            return response()->json([
                'error' => 'Alguno de los paquetes seleccionados ya no está disponible.',
            ], 422);
        }

        DB::beginTransaction();
        try {
            $sack = ShipmentSack::create([
                'shipment_id'      => $shipmentId,
                'transfer_sack_id' => null,
                'sack_number'      => $request->sack_number,
                'packages_count'   => $items->count(),
                'pounds_total'     => $items->sum('pounds'),
                'kilograms_total'  => $items->sum('kilograms'),
            ]);

            foreach ($items as $item) {
                ShipmentSackPackage::create([
                    'shipment_sack_id' => $sack->id,
                    'package_id'       => $item->package_id,
                    'transfer_sack_id' => $item->transfer_sack_id,
                    'pounds'           => $item->pounds,
                    'kilograms'        => $item->kilograms,
                ]);
            }

            DB::commit();
            return response()->json([
                'message' => 'Saca creada correctamente.',
                'id'      => $sack->id,
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Error creando saca de embarque: ' . $e->getMessage());
            return response()->json(['error' => 'Error al guardar la saca.', 'details' => $e->getMessage()], 500);
        }
    }

    /**
     * PUT /api/shipments/{shipment}/sacks/{shipmentSack}
     */
    public function updateSackPackages(Request $request, $shipmentId, $shipmentSackId)
    {
        $user = auth()->user();
        $isAdmin = $this->canViewAllEnterprises($user);

        $shipmentQuery = Shipment::query();
        if (!$isAdmin) {
            $shipmentQuery->where('enterprise_id', $user->enterprise_id);
        }
        $shipment = $shipmentQuery->findOrFail($shipmentId);

        if ($shipment->status === 'CANCELLED') {
            return response()->json(['error' => 'No se puede modificar un embarque cancelado.'], 409);
        }

        $sack = ShipmentSack::where('shipment_id', $shipmentId)->findOrFail($shipmentSackId);

        $request->validate([
            'sack_number'   => 'required|string|max:20',
            'package_ids'   => 'required|array|min:1',
            'package_ids.*' => 'required|uuid',
        ]);

        $newPackageIds = collect($request->package_ids)->unique()->values();

        $conflicting = ShipmentSackPackage::whereIn('package_id', $newPackageIds)
            ->where('shipment_sack_id', '!=', $sack->id)
            ->exists();
        if ($conflicting) {
            return response()->json([
                'error' => 'Uno o más paquetes ya fueron asignados a otra saca de embarque.',
            ], 409);
        }

        DB::beginTransaction();
        try {
            $currentPackageIds = ShipmentSackPackage::where('shipment_sack_id', $sack->id)
                ->pluck('package_id');

            ShipmentSackPackage::where('shipment_sack_id', $sack->id)
                ->whereNotIn('package_id', $newPackageIds)
                ->delete();

            $toAddIds = $newPackageIds->diff($currentPackageIds);
            if ($toAddIds->isNotEmpty()) {
                $items = TransferSackPackage::where('confirmed', true)
                    ->whereIn('package_id', $toAddIds)
                    ->whereHas('sack.transfer', fn($q) => $q->where('status', 'CONFIRMED'))
                    ->get()
                    ->unique('package_id');

                if ($items->count() !== $toAddIds->count()) {
                    DB::rollBack();
                    return response()->json([
                        'error' => 'Alguno de los paquetes seleccionados ya no está disponible.',
                    ], 422);
                }

                foreach ($items as $item) {
                    ShipmentSackPackage::create([
                        'shipment_sack_id' => $sack->id,
                        'package_id'       => $item->package_id,
                        'transfer_sack_id' => $item->transfer_sack_id,
                        'pounds'           => $item->pounds,
                        'kilograms'        => $item->kilograms,
                    ]);
                }
            }

            $finalPivots = ShipmentSackPackage::where('shipment_sack_id', $sack->id)->get();
            $sack->update([
                'sack_number'     => $request->sack_number,
                'packages_count'  => $finalPivots->count(),
                'pounds_total'    => $finalPivots->sum('pounds'),
                'kilograms_total' => $finalPivots->sum('kilograms'),
            ]);

            DB::commit();
            return response()->json(['message' => 'Saca actualizada correctamente.']);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Error actualizando saca de embarque: ' . $e->getMessage());
            return response()->json(['error' => 'Error al actualizar la saca.', 'details' => $e->getMessage()], 500);
        }
    }

    /**
     * Remover una saca completa de un embarque.
     */
    public function removeSack($shipmentId, $shipmentSackId)
    {
        $user = auth()->user();
        $isAdmin = $this->canViewAllEnterprises($user);

        $shipmentQuery = Shipment::query();
        if (!$isAdmin) {
            $shipmentQuery->where('enterprise_id', $user->enterprise_id);
        }
        $shipment = $shipmentQuery->findOrFail($shipmentId);

        if ($shipment->status === 'CANCELLED') {
            return response()->json(['error' => 'No se puede modificar un embarque cancelado.'], 409);
        }

        ShipmentSack::where('shipment_id', $shipmentId)
            ->where('id', $shipmentSackId)
            ->delete();

        return response()->json(['message' => 'Saca removida del embarque.']);
    }
}