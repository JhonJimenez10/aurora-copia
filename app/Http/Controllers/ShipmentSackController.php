<?php

namespace App\Http\Controllers;

use App\Models\Enterprise;
use App\Models\Shipment;
use App\Models\ShipmentSack;
use App\Models\TransferSack;
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
     * ✅ GET /api/enterprises/list-filter (reutilizable, solo admin)
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
     * Obtener sacas confirmadas disponibles para asignar a un embarque.
     * "Confirmadas" = transfer_sack_packages.confirmed = true
     * "Disponibles" = no están ya asignadas a otro embarque
     */
    public function availableSacks(Request $request)
    {
        $user = auth()->user();
        $isAdmin = $this->canViewAllEnterprises($user);
        $enterpriseId = $user->enterprise_id;

        // ✅ Filtro opcional de empresa (solo aplica si es admin)
        $filterEnterpriseId = $request->input('enterprise_id');

        $assignedSackIds = ShipmentSack::pluck('transfer_sack_id')->toArray();

        $sacks = TransferSack::whereHas('transfer', function ($q) use ($isAdmin, $enterpriseId, $filterEnterpriseId) {
                if (!$isAdmin) {
                    // Customer: solo su propia empresa (comportamiento original)
                    $q->where('enterprise_id', $enterpriseId);
                } elseif (!empty($filterEnterpriseId)) {
                    // Admin filtrando una empresa específica
                    $q->where('enterprise_id', $filterEnterpriseId);
                }
                // Admin sin filtro → ve sacas confirmadas de TODAS las empresas
            })
            ->whereHas('sackPackages', function ($q) {
                $q->where('confirmed', true);
            })
            ->whereNotIn('id', $assignedSackIds)
            ->with([
                'transfer:id,number,from_city,to_city,enterprise_id',
                'sackPackages' => function ($q) {
                    $q->where('confirmed', true)
                      ->with([
                          'package:id,reception_id,barcode,content,service_type,pounds,kilograms',
                          'package.reception:id,agency_dest',
                          'package.reception.agencyDest:id,name',
                      ]);
                },
            ])
            ->get();

        // ✅ Nombres de empresa resueltos en una sola consulta
        $enterpriseIds = $sacks->pluck('transfer.enterprise_id')->filter()->unique();
        $enterpriseNames = Enterprise::whereIn('id', $enterpriseIds)->pluck('name', 'id');

        $result = $sacks->map(function ($sack) use ($enterpriseNames) {
                $confirmedPkgs = $sack->sackPackages;

                $destinationAgencies = $confirmedPkgs
                    ->map(fn($sp) => $sp->package?->reception?->agencyDest?->name)
                    ->filter()
                    ->unique()
                    ->values();

                $enterpriseId = $sack->transfer->enterprise_id ?? null;

                return [
                    'id'              => $sack->id,
                    'sack_number'     => $sack->sack_number,
                    'seal'            => $sack->seal,
                    'refrigerated'    => $sack->refrigerated,
                    'transfer_id'     => $sack->transfer_id,
                    'transfer_number' => $sack->transfer->number ?? '—',
                    'from_city'       => $sack->transfer->from_city ?? '—',
                    'to_city'         => $sack->transfer->to_city ?? '—',
                    'enterprise_id'   => $enterpriseId, // ✅ NUEVO
                    'enterprise_name' => $enterpriseNames[$enterpriseId] ?? null, // ✅ NUEVO
                    'packages_count'  => $confirmedPkgs->count(),
                    'pounds_total'    => $confirmedPkgs->sum('pounds'),
                    'kilograms_total' => $confirmedPkgs->sum('kilograms'),
                    'destination_agencies' => $destinationAgencies->implode(', '),
                    'packages'        => $confirmedPkgs->map(fn($sp) => [
                        'id'                 => $sp->package->id ?? $sp->package_id,
                        'barcode'            => $sp->package->barcode ?? '—',
                        'content'            => $sp->package->content ?? '—',
                        'service_type'       => $sp->package->service_type ?? '—',
                        'pounds'             => $sp->pounds,
                        'kilograms'          => $sp->kilograms,
                        'destination_agency'    => $sp->package?->reception?->agencyDest?->name,
                        'destination_agency_id' => $sp->package?->reception?->agencyDest?->id,
                    ])->values(),
                ];
            });

        return response()->json($result);
    }

    /**
     * Obtener sacas ya asignadas a un embarque específico.
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
                'transferSack.transfer:id,number,from_city,to_city,enterprise_id',
                'transferSack.sackPackages' => function ($q) {
                    $q->where('confirmed', true)
                      ->with([
                          'package:id,reception_id,barcode,content,service_type,pounds,kilograms',
                          'package.reception:id,agency_dest',
                          'package.reception.agencyDest:id,name',
                      ]);
                },
            ])
            ->orderBy('sack_number')
            ->get();

        $enterpriseIds = $sacks->pluck('transferSack.transfer.enterprise_id')->filter()->unique();
        $enterpriseNames = Enterprise::whereIn('id', $enterpriseIds)->pluck('name', 'id');

        $mapped = $sacks->map(function ($ss) use ($enterpriseNames) {
                $sack = $ss->transferSack;
                $pkgs = $sack->sackPackages;

                $destinationAgencies = $pkgs
                    ->map(fn($sp) => $sp->package?->reception?->agencyDest?->name)
                    ->filter()
                    ->unique()
                    ->values();

                $enterpriseId = $sack->transfer->enterprise_id ?? null;

                return [
                    'shipment_sack_id' => $ss->id,
                    'id'               => $sack->id,
                    'sack_number'      => $ss->sack_number ?? $sack->sack_number,
                    'seal'             => $sack->seal,
                    'refrigerated'     => $sack->refrigerated,
                    'transfer_number'  => $sack->transfer->number ?? '—',
                    'from_city'        => $sack->transfer->from_city ?? '—',
                    'to_city'          => $sack->transfer->to_city ?? '—',
                    'enterprise_id'    => $enterpriseId, // ✅ NUEVO
                    'enterprise_name'  => $enterpriseNames[$enterpriseId] ?? null, // ✅ NUEVO
                    'packages_count'   => $ss->packages_count,
                    'pounds_total'     => $ss->pounds_total,
                    'kilograms_total'  => $ss->kilograms_total,
                    'destination_agencies' => $destinationAgencies->implode(', '),
                    'packages'         => $pkgs->map(fn($sp) => [
                        'id'                 => $sp->package->id ?? $sp->package_id,
                        'barcode'            => $sp->package->barcode ?? '—',
                        'content'            => $sp->package->content ?? '—',
                        'service_type'       => $sp->package->service_type ?? '—',
                        'pounds'             => $sp->pounds,
                        'kilograms'          => $sp->kilograms,
                        'destination_agency'    => $sp->package?->reception?->agencyDest?->name,
                        'destination_agency_id' => $sp->package?->reception?->agencyDest?->id,
                    ])->values(),
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
     * Asignar sacas a un embarque, con número de saca manual.
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

                // ✅ No se restringe por empresa aquí — si el admin ya vio
                // la saca en availableSacks (de cualquier empresa), puede asignarla.
                $sack = TransferSack::with(['sackPackages' => function ($q) {
                    $q->where('confirmed', true);
                }])->findOrFail($sackId);

                $confirmedPkgs = $sack->sackPackages;

                ShipmentSack::create([
                    'shipment_id'      => $shipmentId,
                    'transfer_sack_id' => $sackId,
                    'sack_number'      => $request->sack_number,
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