<?php

namespace App\Http\Controllers;

use App\Models\ArtPackage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ArtPackageController extends Controller
{
    public function index(Request $request)
    {
        $enterpriseId = Auth::user()->enterprise_id;

        $search = trim((string) $request->query('search', ''));
        $categoria = trim((string) $request->query('categoria', ''));
        $status = $request->query('status', ''); // '', 'active', 'inactive', 'canceled'

        $query = ArtPackage::where('enterprise_id', $enterpriseId);

        if ($search !== '') {
            $searchLower = mb_strtolower($search, 'UTF-8');
            $query->where(function ($q) use ($searchLower) {
                $q->whereRaw('LOWER(name) LIKE ?', ["%{$searchLower}%"])
                    ->orWhereRaw('LOWER(translation) LIKE ?', ["%{$searchLower}%"])
                    ->orWhereRaw('LOWER(codigo_hs) LIKE ?', ["%{$searchLower}%"])
                    ->orWhereRaw('LOWER(codigo_fda) LIKE ?', ["%{$searchLower}%"]);
            });
        }

        if ($categoria !== '') {
            $query->where('categoria', $categoria);
        }

        if ($status === 'active') {
            $query->where('active', true);
        } elseif ($status === 'inactive') {
            $query->where('active', false);
        } elseif ($status === 'canceled') {
            $query->where('canceled', true);
        }

        $paginated = $query->orderBy('name')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('ArtPackage/Index', [
            'art_packages' => $paginated->items(),
            'pagination' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
                'links' => $paginated->linkCollection(),
            ],
            'filters' => [
                'search' => $search,
                'categoria' => $categoria,
                'status' => $status,
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('ArtPackage/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'translation' => 'nullable|string|max:100',
            'codigo_hs' => 'nullable|string|max:50',
            'categoria' => 'nullable|string|max:100',
            'codigo_fda' => 'nullable|alpha_num|max:50',
            'unit_type' => 'nullable|string|max:50',
            'unit_price' => 'required|numeric',
            'agent_val' => 'required|numeric',
            'arancel' => 'required|numeric',
            'canceled' => 'required|boolean',
            'active' => 'required|boolean',
        ]);

        ArtPackage::create([
            ...$validated,
            'enterprise_id' => Auth::user()->enterprise_id,
        ]);

        return redirect()->route('art_packages.index')->with('success', 'Artículo creado correctamente.');
    }

    public function edit($id)
    {
        $artPackage = ArtPackage::where('enterprise_id', Auth::user()->enterprise_id)
            ->findOrFail($id);

        return Inertia::render('ArtPackage/Edit', [
            'art_package' => $artPackage,
        ]);
    }

    public function update(Request $request, $id)
    {
        $artPackage = ArtPackage::where('enterprise_id', Auth::user()->enterprise_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:100',
            'translation' => 'nullable|string|max:100',
            'codigo_hs' => 'nullable|string|max:50',
            'categoria' => 'nullable|string|max:100',
            'codigo_fda' => 'nullable|alpha_num|max:50',
            'unit_type' => 'nullable|string|max:50',
            'unit_price' => 'sometimes|required|numeric',
            'agent_val' => 'sometimes|required|numeric',
            'arancel' => 'sometimes|required|numeric',
            'canceled' => 'sometimes|required|boolean',
            'active' => 'sometimes|required|boolean',
        ]);

        $artPackage->update($validated);

        return redirect()->route('art_packages.index')->with('success', 'Artículo actualizado correctamente.');
    }

    public function destroy($id)
    {
        $artPackage = ArtPackage::where('enterprise_id', Auth::user()->enterprise_id)
            ->findOrFail($id);

        $artPackage->delete();

        return redirect()->route('art_packages.index')->with('success', 'Artículo eliminado correctamente.');
    }

    public function listJson(Request $request)
    {
        $enterpriseId = $request->user()->enterprise_id;

        $artPackages = ArtPackage::where('enterprise_id', $enterpriseId)
            ->where('active', true)
            ->where('canceled', false)
            ->orderBy('name')
            ->get(['id', 'name', 'translation', 'codigo_hs', 'categoria', 'codigo_fda', 'unit_type', 'unit_price', 'arancel']);

        return response()->json($artPackages);
    }

    public function toggleActive($id)
    {
        $artPackage = ArtPackage::where('enterprise_id', Auth::user()->enterprise_id)
            ->findOrFail($id);

        $artPackage->active = !$artPackage->active;
        $artPackage->save();

        $status = $artPackage->active ? 'activado' : 'desactivado';

        return redirect()->route('art_packages.index')->with('success', "Artículo {$status} correctamente.");
    }
}