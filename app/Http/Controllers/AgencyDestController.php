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

        $agencies = AgencyDest::where('enterprise_id', $enterpriseId)->get();

        return Inertia::render('AgencyDest/Index', [
            'agencies' => $agencies,
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
}
