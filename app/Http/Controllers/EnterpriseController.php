<?php

namespace App\Http\Controllers;

use App\Models\Enterprise;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class EnterpriseController extends Controller
{
    public function index()
    {
        $enterprises = Enterprise::all();

        return Inertia::render('Enterprises/Index', [
            'enterprises' => $enterprises,
        ]);
    }

    public function create()
    {
        return Inertia::render('Enterprises/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'ruc' => 'required|string|max:20',
            'name' => 'required|string|max:100',
            'commercial_name' => 'required|string|max:150',
            'matrix_address' => 'required|string|max:255',
            'branch_address' => 'required|string|max:255',
            'accounting' => 'required|boolean',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:100',
            'signature' => 'nullable|file|max:2048',
            'signature_password' => 'nullable|string|max:100',
        ]);

        if ($request->hasFile('signature')) {
            $file = $request->file('signature');
            $filename = uniqid('cert_') . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('private/certificates', $filename); // <- zona segura
            $validated['signature'] = $path;
        }

        Enterprise::create($validated);

        return redirect()->route('enterprises.index')->with('success', 'Empresa creada correctamente.');
    }

    public function edit($id)
    {
        $enterprise = Enterprise::findOrFail($id);

        return Inertia::render('Enterprises/Edit', [
            'enterprise' => $enterprise,
        ]);
    }

    public function update(Request $request, $id)
    {
        $enterprise = Enterprise::findOrFail($id);

        $validated = $request->validate([
            'ruc' => 'sometimes|required|string|max:20',
            'name' => 'sometimes|required|string|max:100',
            'commercial_name' => 'sometimes|required|string|max:150',
            'matrix_address' => 'sometimes|required|string|max:255',
            'branch_address' => 'sometimes|required|string|max:255',
            'accounting' => 'sometimes|required|boolean',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:100',
            'signature' => 'nullable|file|mimes:p12|max:2048',
            'signature_password' => 'nullable|string|max:100',
        ]);

        if ($request->hasFile('signature')) {
            $file = $request->file('signature');
            $filename = uniqid('cert_') . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('private/certificates', $filename);
            $validated['signature'] = $path;
        }

        $enterprise->update($validated);

        return redirect()->route('enterprises.index')->with('success', 'Empresa actualizada correctamente.');
    }

    public function destroy($id)
    {
        $enterprise = Enterprise::findOrFail($id);
        $enterprise->delete();

        return redirect()->route('enterprises.index')->with('success', 'Empresa eliminada correctamente.');
    }
}
