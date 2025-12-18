<?php

namespace App\Http\Controllers;

use App\Models\Enterprise;
use App\Models\Package;
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
     * GET /transfers/create
     * Muestra la pantalla "Elaborar traslado"
     */
    public function create()
    {
        $user = Auth::user();
        $enterpriseId = $user->enterprise_id ?? null;

        // Países: por ahora fijo ECUADOR
        $countries = ['ECUADOR'];

        // Agencias = ciudades de la tabla enterprises (sin repetir)
        $agencies = Enterprise::query()
            ->whereNotNull('city')
            ->orderBy('city')
            ->pluck('city')
            ->unique()
            ->values()
            ->toArray();

        return Inertia::render('Transfers/Create', [
            'countries' => $countries,
            'agencies'  => $agencies,
        ]);
    }

    /**
     * GET /api/transfers/available-packages?from_city=CUENCA%20CENTRO&search=
     * Devuelve paquetes "emitidos" en una agencia (ciudad) que aún no están en un traslado pendiente.
     * Ahora con búsqueda por código de paquete o contenido.
     */
    public function availablePackages(Request $request)
    {
        $user = Auth::user();
        $enterpriseId = $user->enterprise_id;

        $data = $request->validate([
            'from_city' => 'required|string|max:100',
            'search' => 'nullable|string|max:255',
        ]);

        $fromCity = $data['from_city'];
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
            ->where('receptions.agency_origin', $fromCity)
            // ⚠️ CORREGIDO: relación debe coincidir con Package model
            ->whereDoesntHave('transferSackItems', function ($q) {
                $q->whereHas('sack.transfer', function ($tq) {
                    $tq->where('status', 'PENDING');
                });
            });

        // Aplicar búsqueda si existe
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('packages.barcode', 'LIKE', "%{$search}%")
                    ->orWhere('packages.content', 'LIKE', "%{$search}%")
                    ->orWhere('packages.id', 'LIKE', "%{$search}%");
            });
        }

        $packages = $query
            ->orderBy('packages.created_at', 'desc')
            ->limit(100)
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

        return response()->json($packages);
    }

    /**
     * GET /api/transfers/search
     * Busca documentos de traslado para el modal "Buscar documentos traslado".
     */
    public function search(Request $request)
    {
        $user = Auth::user();
        $enterpriseId = $user->enterprise_id;

        $data = $request->validate([
            'start_date'   => 'nullable|date',
            'end_date'     => 'nullable|date',
            'country'      => 'nullable|string|max:100',
            'from_city'    => 'nullable|string|max:100',
            'to_city'      => 'nullable|string|max:100',
            'only_pending' => 'nullable|boolean',
        ]);

        $query = Transfer::query()
            ->select('id', 'number', 'country', 'from_city', 'to_city', 'status', 'created_at')
            ->where('enterprise_id', $enterpriseId);

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
            ->get()
            ->map(function (Transfer $t) {
                return [
                    'id'        => $t->id,
                    'number'    => $t->number,
                    'country'   => $t->country,
                    'from_city' => $t->from_city,
                    'to_city'   => $t->to_city,
                    'status'    => $t->status, // ✅ Agregado para mostrar en frontend
                ];
            });

        return response()->json($results);
    }

    /**
     * POST /transfers
     * Guarda el documento de traslado con sus sacas y paquetes.
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        $enterpriseId = $user->enterprise_id;

        $data = $request->validate([
            'number'     => 'nullable|string|max:30',
            'country'    => 'required|string|max:100',
            'from_city'  => 'required|string|max:100',
            'to_city'    => 'required|string|max:100',
            'sacks'      => 'required|array|min:1',
            'sacks.*.number'       => 'required|integer|min:1',
            'sacks.*.refrigerated' => 'required|boolean',
            'sacks.*.seal'         => 'nullable|string|max:100',
            'sacks.*.packages'     => 'required|array|min:1',
            'sacks.*.packages.*.id'        => 'required|uuid|exists:packages,id',
            'sacks.*.packages.*.pounds'    => 'required|numeric|min:0',
            'sacks.*.packages.*.kilograms' => 'required|numeric|min:0',
        ]);

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
                    TransferSackPackage::create([
                        'transfer_sack_id' => $sack->id,
                        'package_id'       => $pkg['id'],
                        'pounds'           => $pkg['pounds'],
                        'kilograms'        => $pkg['kilograms'],
                        'confirmed'        => false, // ✅ Por defecto no confirmado
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
     * Genera el siguiente número de traslado de forma simple por empresa.
     */
    protected function generateNextNumber(string $enterpriseId): string
    {
        $last = Transfer::where('enterprise_id', $enterpriseId)
            ->orderByDesc('created_at')
            ->value('number');

        if (!$last) {
            return '000001';
        }

        $num = (int) preg_replace('/\D/', '', $last);
        $next = $num + 1;

        return str_pad((string) $next, 6, '0', STR_PAD_LEFT);
    }
}
