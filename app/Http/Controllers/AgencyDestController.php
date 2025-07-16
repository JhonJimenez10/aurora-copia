<?php

namespace App\Http\Controllers;

use App\Models\AgencyDest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AgencyDestController extends Controller
{
    public function index()
    {
        $enterpriseId = Auth::user()->enterprise_id;

        $paginated = AgencyDest::where('enterprise_id', $enterpriseId)
            ->orderBy('name')
            ->paginate(10); // Puedes cambiar 10 por la cantidad que prefieras

        return Inertia::render('AgencyDest/Index', [
            'agencies' => $paginated->items(),
            'pagination' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
                'links' => $paginated->linkCollection(),
            ],
        ]);
    }


    public function create()
    {
        return Inertia::render('AgencyDest/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:100',
            'code_letters'   => 'required|string|max:10',
            'trade_name'     => 'nullable|string|max:150',
            'address'        => 'nullable|string|max:255',
            'phone'          => 'nullable|string|max:20',
            'postal_code'    => 'nullable|string|max:20',
            'city'           => 'nullable|string|max:100',
            'state'          => 'nullable|string|max:100',
            'available_us'   => 'required|boolean',
            'value'          => 'required|numeric|min:0',
        ]);

        $validated['enterprise_id'] = Auth::user()->enterprise_id;

        AgencyDest::create($validated);

        return redirect()->route('agencies_dest.index')->with('success', 'Agencia registrada correctamente.');
    }

    public function edit($id)
    {
        $agency = AgencyDest::where('enterprise_id', Auth::user()->enterprise_id)->findOrFail($id);

        return Inertia::render('AgencyDest/Edit', [
            'agency' => $agency,
        ]);
    }

    public function update(Request $request, $id)
    {
        $agency = AgencyDest::where('enterprise_id', Auth::user()->enterprise_id)->findOrFail($id);

        $validated = $request->validate([
            'name'           => 'sometimes|required|string|max:100',
            'code_letters'   => 'sometimes|required|string|max:10',
            'trade_name'     => 'nullable|string|max:150',
            'address'        => 'nullable|string|max:255',
            'phone'          => 'nullable|string|max:20',
            'postal_code'    => 'nullable|string|max:20',
            'city'           => 'nullable|string|max:100',
            'state'          => 'nullable|string|max:100',
            'available_us'   => 'sometimes|required|boolean',
            'value'          => 'sometimes|required|numeric|min:0',
        ]);

        $agency->update($validated);

        return redirect()->route('agencies_dest.index')->with('success', 'Agencia actualizada correctamente.');
    }

    public function destroy($id)
    {
        $agency = AgencyDest::where('enterprise_id', Auth::user()->enterprise_id)->findOrFail($id);
        $agency->delete();

        return redirect()->route('agencies_dest.index')->with('success', 'Agencia eliminada correctamente.');
    }
    public function listByEnterprise(Request $request)
    {
        $user = auth()->user();

        if (!$user) {
            return response()->json(['error' => 'No autenticado'], 403);
        }

        try {
            $agencies = AgencyDest::where('enterprise_id', $user->enterprise_id)
                ->select('id', 'name', 'trade_name', 'address', 'phone', 'city', 'state', 'postal_code', 'value')
                ->get();

            return response()->json($agencies);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Error interno',
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }
}
