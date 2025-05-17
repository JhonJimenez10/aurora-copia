<?php

namespace App\Http\Controllers;

use App\Models\ArtPackg;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ArtPackgController extends Controller
{
    public function index()
    {
        $enterpriseId = Auth::user()->enterprise_id;

        $artPackgs = ArtPackg::where('enterprise_id', $enterpriseId)->get();

        return Inertia::render('ArtPackg/Index', [
            'artPackgs' => $artPackgs,
        ]);
    }

    public function create()
    {
        return Inertia::render('ArtPackg/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'unit_type' => 'nullable|string|max:50',
            'unit_price' => 'required|numeric',
            'canceled' => 'required|boolean',
        ]);

        $enterpriseId = Auth::user()->enterprise_id;

        if (!$enterpriseId) {
            return redirect()->back()->withErrors(['enterprise_id' => 'No se ha asignado empresa al usuario.']);
        }

        ArtPackg::create([
            ...$validated,
            'enterprise_id' => $enterpriseId,
        ]);

        return redirect()->route('art_packgs.index')->with('success', 'Artículo creado correctamente.');
    }

    public function edit($id)
    {
        $artPackg = ArtPackg::findOrFail($id);

        return Inertia::render('ArtPackg/Edit', [
            'art_packg' => $artPackg,
        ]);
    }

    public function update(Request $request, $id)
    {
        $artPackg = ArtPackg::findOrFail($id);

        // Solo actualiza los campos permitidos (no enterprise_id)
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:100',
            'unit_type' => 'nullable|string|max:50',
            'unit_price' => 'sometimes|required|numeric',
            'canceled' => 'sometimes|required|boolean',
        ]);

        $artPackg->update($validated);

        return redirect()->route('art_packgs.index')->with('success', 'Artículo actualizado correctamente.');
    }

    public function destroy($id)
    {
        $artPackg = ArtPackg::findOrFail($id);
        $artPackg->delete();

        return redirect()->route('art_packgs.index')->with('success', 'Artículo eliminado correctamente.');
    }

    // Retorna artículos filtrados por empresa autenticada
    public function listJson()
    {
        $enterpriseId = Auth::user()->enterprise_id;

        $artPackgs = ArtPackg::where('enterprise_id', $enterpriseId)
            ->where('canceled', false)
            ->select('id', 'name', 'unit_price', 'unit_type')
            ->orderBy('name')
            ->get();

        return response()->json($artPackgs);
    }
}
