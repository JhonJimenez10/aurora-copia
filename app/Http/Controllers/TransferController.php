<?php

namespace App\Http\Controllers;

use App\Models\Enterprise;
use App\Models\Package;
use App\Models\Reception;
use App\Models\Transfer;
use App\Models\TransferSack;
use App\Models\TransferSackPackage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TransferController extends Controller
{
    /**
     * ✅ Mismo criterio que en TransferConfirmController.
     */
    private function canViewAllEnterprises($user): bool
    {
        $roleName = $user->role->name ?? null;
        return in_array($roleName, ['Admin', 'Sudo'], true);
    }

    /**
     * Lista de empresas seleccionables para el combo de admin,
     * excluyendo siempre COAVPRO.
     */
    private function selectableEnterprises()
    {
        return Enterprise::query()
            ->where(function ($q) {
                $q->whereNull('commercial_name')
                    ->orWhere('commercial_name', '!=', 'COAVPRO');
            })
            ->orderBy('name')
            ->get(['id', 'name', 'city']);
    }

    /**
     * Calcula los "Trasladar de" (agency_origin reales de las recepciones)
     * para una empresa puntual, con respaldo a su ciudad si no tiene ninguna.
     */
    private function fromCitiesFor(string $enterpriseId)
    {
        $enterprise = Enterprise::find($enterpriseId);

        $fromCities = Reception::where('enterprise_id', $enterpriseId)
            ->whereNotNull('agency_origin')
            ->where('agency_origin', '!=', '')
            ->distinct()
            ->orderBy('agency_origin')
            ->pluck('agency_origin');

        if ($fromCities->isEmpty() && $enterprise?->city) {
            $fromCities = collect([$enterprise->city]);
        }

        return $fromCities->values();
    }

    /**
     * GET /transfers/create
     */
    public function create()
    {
        $user         = auth()->user();
        $isAdmin      = $this->canViewAllEnterprises($user);
        $enterpriseId = $user->enterprise_id;

        $fromCities = $this->fromCitiesFor($enterpriseId);
        $toCities   = collect(['CUENCA']);

        $enterprises = $isAdmin ? $this->selectableEnterprises() : collect();

        return Inertia::render('Transfers/Create', [
            'fromCities'  => $fromCities,
            'toCities'    => $toCities,
            'isAdmin'     => $isAdmin,
            'enterprises' => $enterprises,
        ]);
    }

    /**
     * GET /api/transfers/from-cities?enterprise_id=...
     * Devuelve el "Trasladar de" de la empresa elegida en el combo (solo admin/sudo).
     */
    public function fromCitiesForEnterprise(Request $request)
    {
        $user = Auth::user();

        if (!$this->canViewAllEnterprises($user)) {
            abort(403, 'No tienes permiso para consultar otras empresas.');
        }

        $data = $request->validate([
            'enterprise_id' => 'required|uuid|exists:enterprises,id',
        ]);

        return response()->json(
            $this->fromCitiesFor($data['enterprise_id']),
            200,
            ['Content-Type' => 'application/json'],
        );
    }

    /**
     * GET /api/transfers/available-packages
     */
    public function availablePackages(Request $request)
    {
        $user = Auth::user();
        $isAdmin = $this->canViewAllEnterprises($user);

        $data = $request->validate([
            'from_city'     => 'nullable|string|max:100', // ya no se usa para filtrar, solo referencia
            'search'        => 'nullable|string|max:255',
            'enterprise_id' => 'nullable|uuid|exists:enterprises,id', // solo admin/sudo
        ]);

        $enterpriseId = $user->enterprise_id;
        if ($isAdmin && !empty($data['enterprise_id'])) {
            $enterpriseId = $data['enterprise_id'];
        }

        $search = $data['search'] ?? null;

        $query = Package::query()
            ->select(
                'packages.id',
                'packages.barcode',
                'packages.content',
                'packages.service_type',
                'packages.pounds',
                'packages.kilograms'
            )
            ->join('receptions', 'receptions.id', '=', 'packages.reception_id')
            ->where('receptions.enterprise_id', $enterpriseId)
            // ✅ CORREGIDO: antes solo excluía paquetes en traslados PENDIENTES,
            // así que en cuanto un traslado se CONFIRMABA, el paquete volvía a
            // aparecer como "disponible" y se podía trasladar de nuevo — de ahí
            // los duplicados. Ahora se excluye si el paquete está en CUALQUIER
            // traslado activo (PENDING o CONFIRMED). Solo si ese traslado se
            // elimina (ver destroy() más abajo) el paquete vuelve a liberarse.
            ->whereDoesntHave('transferSackItems', function ($q) {
                $q->whereHas('sack.transfer', function ($tq) {
                    $tq->whereIn('status', ['PENDING', 'CONFIRMED']);
                });
            });

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('packages.barcode', 'LIKE', "%{$search}%")
                    ->orWhere('packages.content', 'LIKE', "%{$search}%")
                    ->orWhere('packages.id', 'LIKE', "%{$search}%");
            });
        }

        $packages = $query
            ->orderBy('packages.created_at', 'desc')
            ->limit(500)
            ->get()
            ->map(function ($p) {
                return [
                    'id'          => $p->id,
                    'code'        => $p->barcode ?? $p->id,
                    'content'     => $p->content,
                    'serviceType' => $p->service_type,
                    'pounds'      => (float) $p->pounds,
                    'kilograms'   => (float) $p->kilograms,
                ];
            });

        return response()->json($packages, 200, [
            'Content-Type' => 'application/json'
        ]);
    }

    /**
     * GET /api/transfers/search
     */
    public function search(Request $request)
    {
        $user = Auth::user();
        $isAdmin = $this->canViewAllEnterprises($user);

        $data = $request->validate([
            'start_date'    => 'nullable|date',
            'end_date'      => 'nullable|date',
            'country'       => 'nullable|string|max:100',
            'from_city'     => 'nullable|string|max:100',
            'to_city'       => 'nullable|string|max:100',
            'only_pending'  => 'nullable|boolean',
            'enterprise_id' => 'nullable|uuid',
        ]);

        $query = Transfer::query()
            ->select('id', 'number', 'country', 'from_city', 'to_city', 'status', 'enterprise_id', 'created_at');

        if ($isAdmin) {
            if (!empty($data['enterprise_id'])) {
                $query->where('enterprise_id', $data['enterprise_id']);
            }
        } else {
            $query->where('enterprise_id', $user->enterprise_id);
        }

        if (!empty($data['start_date'])) {
            $query->whereDate('created_at', '>=', $data['start_date']);
        }

        if (!empty($data['end_date'])) {
            $query->whereDate('created_at', '<=', $data['end_date']);
        }

        if (!empty($data['country'])) {
            $query->where('country', $data['country']);
        }

        if (!empty($data['from_city'])) {
            $query->where('from_city', $data['from_city']);
        }

        if (!empty($data['to_city'])) {
            $query->where('to_city', $data['to_city']);
        }

        if (!empty($data['only_pending']) && $data['only_pending']) {
            $query->where('status', 'PENDING');
        }

        $results = $query
            ->orderByDesc('created_at')
            ->limit(200)
            ->get();

        $enterpriseNames = Enterprise::whereIn('id', $results->pluck('enterprise_id')->unique())
            ->pluck('name', 'id');

        $mapped = $results->map(function (Transfer $t) use ($enterpriseNames) {
            return [
                'id'              => $t->id,
                'number'          => $t->number,
                'country'         => $t->country,
                'from_city'       => $t->from_city,
                'to_city'         => $t->to_city,
                'status'          => $t->status, // ✅ el front ya lo usa para habilitar "Eliminar"
                'enterprise_name' => $enterpriseNames[$t->enterprise_id] ?? null,
            ];
        });

        return response()->json($mapped, 200, [
            'Content-Type' => 'application/json'
        ]);
    }

    /**
     * POST /transfers
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        $isAdmin = $this->canViewAllEnterprises($user);

        $data = $request->validate([
            'enterprise_id' => 'nullable|uuid|exists:enterprises,id', // solo admin/sudo
            'number'        => 'nullable|string|max:30',
            'country'       => 'required|string|max:100',
            'from_city'     => 'required|string|max:100',
            'to_city'       => 'required|string|max:100',
            'sacks'         => 'required|array|min:1',
            'sacks.*.number'       => 'required|integer|min:1',
            'sacks.*.refrigerated' => 'required|boolean',
            'sacks.*.seal'         => 'nullable|string|max:100',
            'sacks.*.packages'     => 'required|array|min:1',
            'sacks.*.packages.*.id'        => 'required|uuid|exists:packages,id',
            'sacks.*.packages.*.pounds'    => 'required|numeric|min:0',
            'sacks.*.packages.*.kilograms' => 'required|numeric|min:0',
        ]);

        $enterpriseId = $user->enterprise_id;
        if ($isAdmin && !empty($data['enterprise_id'])) {
            $enterpriseId = $data['enterprise_id'];
        }

        // ✅ NUEVO: salvaguarda final contra duplicados — aunque el listado ya
        // excluye paquetes trasladados, esto cubre el caso de dos pestañas
        // abiertas guardando casi al mismo tiempo. Si algún paquete elegido
        // ya pertenece a un traslado activo (PENDING o CONFIRMED), se
        // rechaza todo el guardado con un mensaje claro.
        $allPackageIds = collect($data['sacks'])
            ->pluck('packages')
            ->flatten(1)
            ->pluck('id')
            ->unique()
            ->values();

        $alreadyUsed = TransferSackPackage::whereIn('package_id', $allPackageIds)
            ->whereHas('sack.transfer', function ($q) {
                $q->whereIn('status', ['PENDING', 'CONFIRMED']);
            })
            ->exists();

        if ($alreadyUsed) {
            return back()->withErrors([
                'transfer' => 'Uno o más paquetes seleccionados ya fueron trasladados anteriormente. Actualiza la lista de paquetes disponibles e intenta nuevamente.',
            ]);
        }

        $number = $data['number'] ?: $this->generateNextNumber($enterpriseId);

        DB::beginTransaction();

        try {
            $transfer = Transfer::create([
                'enterprise_id' => $enterpriseId,
                'number'        => $number,
                'country'       => $data['country'],
                'from_city'     => $data['from_city'],
                'to_city'       => $data['to_city'],
                'status'        => 'PENDING',
                'created_by'    => $user->id,
            ]);

            foreach ($data['sacks'] as $sackData) {
                $packagesCount = count($sackData['packages']);
                $poundsTotal = collect($sackData['packages'])->sum('pounds');
                $kilogramsTotal = collect($sackData['packages'])->sum('kilograms');

                $sack = TransferSack::create([
                    'transfer_id'     => $transfer->id,
                    'sack_number'     => $sackData['number'],
                    'refrigerated'    => $sackData['refrigerated'],
                    'seal'            => $sackData['seal'] ?? null,
                    'packages_count'  => $packagesCount,
                    'pounds_total'    => $poundsTotal,
                    'kilograms_total' => $kilogramsTotal,
                ]);

                foreach ($sackData['packages'] as $pkg) {
                    // Salvaguarda: el paquete debe pertenecer realmente a la
                    // empresa a nombre de la cual se crea el traslado.
                    $belongs = Package::query()
                        ->join('receptions', 'receptions.id', '=', 'packages.reception_id')
                        ->where('packages.id', $pkg['id'])
                        ->where('receptions.enterprise_id', $enterpriseId)
                        ->exists();

                    if (!$belongs) {
                        throw new \RuntimeException(
                            'Uno o más paquetes no pertenecen a la empresa seleccionada.'
                        );
                    }

                    TransferSackPackage::create([
                        'transfer_sack_id' => $sack->id,
                        'package_id'       => $pkg['id'],
                        'pounds'           => $pkg['pounds'],
                        'kilograms'        => $pkg['kilograms'],
                        'confirmed'        => false,
                    ]);
                }
            }

            DB::commit();

            return redirect()
                ->route('transfers.create')
                ->with('success', "Traslado {$transfer->number} creado correctamente.");
        } catch (\Throwable $e) {
            DB::rollBack();
            report($e);

            return back()->withErrors([
                'transfer' => 'Error al guardar el traslado: ' . $e->getMessage(),
            ]);
        }
    }

    /**
     * ✅ NUEVO: DELETE /transfers/{transfer}
     * Elimina un traslado PENDIENTE (aún no confirmado) y libera sus
     * paquetes para que vuelvan a estar disponibles en un traslado nuevo.
     * Las sacas y sus paquetes se borran en cascada por las FKs.
     */
    public function destroy($id)
    {
        $user = Auth::user();
        $isAdmin = $this->canViewAllEnterprises($user);

        $query = Transfer::query();
        if (!$isAdmin) {
            $query->where('enterprise_id', $user->enterprise_id);
        }
        $transfer = $query->findOrFail($id);

        if ($transfer->status !== 'PENDING') {
            return back()->withErrors([
                'transfer' => 'Solo se pueden eliminar traslados pendientes. Este traslado ya fue confirmado o cancelado.',
            ]);
        }

        DB::beginTransaction();
        try {
            // transfer_sacks -> cascadeOnDelete, transfer_sack_packages -> cascadeOnDelete
            $transfer->delete();

            DB::commit();

            return redirect()
                ->route('transfers.create')
                ->with('success', 'Traslado eliminado correctamente. Sus paquetes vuelven a estar disponibles.');
        } catch (\Throwable $e) {
            DB::rollBack();
            report($e);

            return back()->withErrors([
                'transfer' => 'Error al eliminar el traslado: ' . $e->getMessage(),
            ]);
        }
    }

    protected function generateNextNumber(string $enterpriseId): string
    {
        $maxNumber = Transfer::where('enterprise_id', $enterpriseId)
            ->selectRaw("MAX(NULLIF(regexp_replace(number, '[^0-9]', '', 'g'), '')::integer) as max_num")
            ->value('max_num');

        $next = ((int) $maxNumber) + 1;

        return str_pad((string) $next, 6, '0', STR_PAD_LEFT);
    }
}