<?php

namespace App\Http\Controllers;

use App\Models\ArtPackage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ArtPackageController extends Controller
{
    public function index()
    {
        $enterpriseId = Auth::user()->enterprise_id;

        $artPackages = ArtPackage::where('enterprise_id', $enterpriseId)->get();

        return Inertia::render('ArtPackage/Index', [
            'art_packages' => $artPackages,
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
            'unit_type' => 'nullable|string|max:50',
            'unit_price' => 'required|numeric',
            'agent_val' => 'required|numeric',
            'canceled' => 'required|boolean',
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
            'unit_type' => 'nullable|string|max:50',
            'unit_price' => 'sometimes|required|numeric',
            'agent_val' => 'sometimes|required|numeric',
            'canceled' => 'sometimes|required|boolean',
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
            ->where('canceled', false)
            ->get(['id', 'name', 'translation', 'unit_price']);

        return response()->json($artPackages);
    }
}
