<?php

namespace App\Http\Controllers;

use App\Models\Additional;
use App\Models\Reception;
use App\Models\ArtPackg;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdditionalController extends Controller
{
    public function index()
    {
        $additionals = Additional::with('reception', 'artPackg')->get();

        return Inertia::render('Additional/Index', [
            'additionals' => $additionals,
        ]);
    }

    public function create()
    {
        return Inertia::render('Additional/Create', [
            'receptions' => Reception::all(['id', 'number']),
            'artPackgs' => ArtPackg::all(['id', 'name']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'reception_id' => 'required|uuid',
            'art_packg_id' => 'nullable|uuid',
            'quantity' => 'required|integer',
            'unit_price' => 'required|numeric',
            'total' => 'required|numeric',
        ]);

        Additional::create($validated);

        return redirect()->route('additionals.index')->with('success', 'Additional service created successfully.');
    }

    public function edit($id)
    {
        $additional = Additional::findOrFail($id);

        return Inertia::render('Additional/Edit', [
            'additional' => $additional,
            'receptions' => Reception::all(['id', 'number']),
            'artPackgs' => ArtPackg::all(['id', 'name']),
        ]);
    }

    public function update(Request $request, $id)
    {
        $additional = Additional::findOrFail($id);

        $validated = $request->validate([
            'reception_id' => 'sometimes|required|uuid',
            'art_packg_id' => 'nullable|uuid',
            'quantity' => 'sometimes|required|integer',
            'unit_price' => 'sometimes|required|numeric',
            'total' => 'sometimes|required|numeric',
        ]);

        $additional->update($validated);

        return redirect()->route('additionals.index')->with('success', 'Additional service updated successfully.');
    }

    public function destroy($id)
    {
        $additional = Additional::findOrFail($id);
        $additional->delete();

        return redirect()->route('additionals.index')->with('success', 'Additional service deleted successfully.');
    }
}
