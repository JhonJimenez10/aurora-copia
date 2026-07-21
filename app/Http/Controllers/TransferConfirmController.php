<?php

namespace App\Http\Controllers;

use App\Models\Enterprise;
use App\Models\Transfer;
use App\Models\TransferSack;
use App\Models\Package;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class TransferConfirmController extends Controller
{
    /**
     * ✅ Admin/Sudo pueden ver y confirmar traslados de TODAS las empresas.
     * Customer sigue viendo solo la suya.
     */
    private function canViewAllEnterprises($user): bool
    {
        $roleName = $user->role->name ?? null;
        return in_array($roleName, ['Admin', 'Sudo'], true);
    }

    /**
     * GET /classification/transfers/confirm
     */
    public function index()
    {
        $user = Auth::user();
        $isAdmin = $this->canViewAllEnterprises($user);

        $countries = ['ECUADOR'];

        // Las ciudades de agencias se mantienen igual (ya eran globales)
        $agencies = Enterprise::query()
            ->whereNotNull('city')
            ->orderBy('city')
            ->pluck('city')
            ->unique()
            ->values()
            ->toArray();

        // ✅ Lista de empresas para el filtro, solo si es admin/sudo
        $enterprises = $isAdmin
            ? Enterprise::query()->orderBy('name')->get(['id', 'name', 'city'])
            : collect();

        return Inertia::render('Classification/TransfersConfirm', [
            'countries'   => $countries,
            'agencies'    => $agencies,
            'isAdmin'     => $isAdmin,     // ✅ NUEVO — necesario para el front
            'enterprises' => $enterprises, // ✅ NUEVO — necesario para el combo
        ]);
    }

    /**
     * ✅ GET /api/enterprises/list-filter
     * Lista de empresas para combos de filtro (solo admin/sudo).
     */
    public function enterprisesList()
    {
        $user = Auth::user();

        if (!$this->canViewAllEnterprises($user)) {
            return response()->json([], 200, ['Content-Type' => 'application/json']);
        }

        $enterprises = Enterprise::query()->orderBy('name')->get(['id', 'name', 'city']);

        return response()->json($enterprises, 200, ['Content-Type' => 'application/json']);
    }

    /**
     * GET /api/transfers/{transfer}/details
     */
    public function show(Transfer $transfer)
    {
        $user = Auth::user();
        $isAdmin = $this->canViewAllEnterprises($user);

        // ✅ Solo se restringe por empresa si NO es admin/sudo
        if (!$isAdmin && $transfer->enterprise_id !== $user->enterprise_id) {
            return response()->json([
                'error' => 'No tienes permiso para ver este traslado.'
            ], 403, ['Content-Type' => 'application/json']);
        }

        if ($transfer->status !== 'PENDING') {
            return response()->json([
                'error' => 'Este traslado ya fue confirmado o cancelado.',
                'status' => $transfer->status
            ], 422, ['Content-Type' => 'application/json']);
        }

        $transfer->load(['sacks.packages']);

        // ✅ Nombre de la empresa dueña del traslado (útil para el admin)
        $enterpriseName = Enterprise::where('id', $transfer->enterprise_id)->value('name');

        $sacks = $transfer->sacks->map(function (TransferSack $sack) {
            $pending = $sack->packages->filter(fn($p) => !$p->pivot->confirmed)->values();
            $confirmed = $sack->packages->filter(fn($p) => $p->pivot->confirmed)->values();

            $mapPackage = function (Package $p) {
                return [
                    'id'          => (string) $p->id,
                    'code'        => $p->barcode ?? $p->id,
                    'content'     => $p->content ?? '',
                    'serviceType' => $p->service_type ?? '',
                    'pounds'      => (float) ($p->pivot->pounds ?? 0),
                    'kilograms'   => (float) ($p->pivot->kilograms ?? 0),
                ];
            };

            return [
                'id'           => $sack->id,
                'number'       => $sack->sack_number,
                'seal'         => $sack->seal,
                'refrigerated' => (bool) $sack->refrigerated,
                'pending'      => $pending->map($mapPackage)->all(),
                'confirmed'    => $confirmed->map($mapPackage)->all(),
            ];
        })->values();

        return response()->json([
            'id'              => $transfer->id,
            'number'          => $transfer->number,
            'from_city'       => $transfer->from_city,
            'to_city'         => $transfer->to_city,
            'enterprise_name' => $enterpriseName, // ✅ NUEVO
            'sacks'           => $sacks,
        ], 200, ['Content-Type' => 'application/json']);
    }

    /**
     * PUT /api/transfers/{transfer}/sacks
     */
    public function updateSacks(Request $request, Transfer $transfer)
    {
        $user = Auth::user();
        $isAdmin = $this->canViewAllEnterprises($user);

        // ✅ Solo se restringe por empresa si NO es admin/sudo
        if (!$isAdmin && $transfer->enterprise_id !== $user->enterprise_id) {
            return response()->json([
                'error' => 'No tienes permiso para modificar este traslado.'
            ], 403, ['Content-Type' => 'application/json']);
        }

        if ($transfer->status !== 'PENDING') {
            throw ValidationException::withMessages([
                'transfer' => 'Este traslado ya fue confirmado o cancelado.'
            ]);
        }

        $data = $request->validate([
            'sacks'                           => ['required', 'array', 'min:1'],
            'sacks.*.number'                  => ['required', 'integer', 'min:1'],
            'sacks.*.seal'                     => ['nullable', 'string', 'max:100'],
            'sacks.*.refrigerated'            => ['required', 'boolean'],
            'sacks.*.confirmedPackageIds'     => ['required', 'array'],
            'sacks.*.confirmedPackageIds.*'   => ['required', 'uuid'],
        ]);

        DB::beginTransaction();

        try {
            $allSacksFullyConfirmed = true;

            foreach ($data['sacks'] as $sackData) {
                $sack = $transfer->sacks()
                    ->where('sack_number', $sackData['number'])
                    ->firstOrFail();

                $sack->update([
                    'seal'         => $sackData['seal'] ?? null,
                    'refrigerated' => $sackData['refrigerated'],
                ]);

                $allPackageIds = $sack->packages()->pluck('packages.id')->toArray();
                $confirmedIds = $sackData['confirmedPackageIds'];

                foreach ($allPackageIds as $packageId) {
                    $isConfirmed = in_array($packageId, $confirmedIds);

                    $sack->packages()->updateExistingPivot($packageId, [
                        'confirmed' => $isConfirmed,
                    ]);

                    if (!$isConfirmed) {
                        $allSacksFullyConfirmed = false;
                    }
                }
            }

            if ($allSacksFullyConfirmed) {
                $transfer->update([
                    'status'       => 'CONFIRMED',
                    'confirmed_by' => $user->id,
                    'confirmed_at' => now(),
                ]);
            }

            DB::commit();

            return response()->json([
                'ok'     => true,
                'status' => $transfer->status,
                'message' => $allSacksFullyConfirmed
                    ? 'Traslado confirmado completamente.'
                    : 'Progreso de confirmación guardado.',
            ], 200, ['Content-Type' => 'application/json']);
        } catch (\Throwable $e) {
            DB::rollBack();
            report($e);

            return response()->json([
                'error' => 'Error al guardar la confirmación: ' . $e->getMessage()
            ], 500, ['Content-Type' => 'application/json']);
        }
    }

    /**
     * DELETE /api/transfers/{transfer}/cancel
     */
    public function cancel(Transfer $transfer)
    {
        $user = Auth::user();
        $isAdmin = $this->canViewAllEnterprises($user);

        // ✅ Solo se restringe por empresa si NO es admin/sudo
        if (!$isAdmin && $transfer->enterprise_id !== $user->enterprise_id) {
            return response()->json([
                'error' => 'No tienes permiso para cancelar este traslado.'
            ], 403, ['Content-Type' => 'application/json']);
        }

        if ($transfer->status !== 'PENDING') {
            throw ValidationException::withMessages([
                'transfer' => 'Solo puedes cancelar traslados pendientes.'
            ]);
        }

        DB::beginTransaction();

        try {
            $transfer->update([
                'status'       => 'CANCELLED',
                'confirmed_by' => $user->id,
                'confirmed_at' => now(),
            ]);

            DB::commit();

            return response()->json([
                'ok'      => true,
                'message' => 'Traslado cancelado correctamente.'
            ], 200, ['Content-Type' => 'application/json']);
        } catch (\Throwable $e) {
            DB::rollBack();
            report($e);

            return response()->json([
                'error' => 'Error al cancelar el traslado: ' . $e->getMessage()
            ], 500, ['Content-Type' => 'application/json']);
        }
    }
}