<?php
// app/Http/Controllers/EnterpriseController.php

namespace App\Http\Controllers;

use App\Models\Enterprise;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class EnterpriseController extends Controller
{
    public function index()
    {
        $enterprises = Enterprise::all();
        return Inertia::render('Enterprises/Index', compact('enterprises'));
    }

    public function create()
    {
        return Inertia::render('Enterprises/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'ruc'                => 'required|string|max:20',
            'name'               => 'required|string|max:100',
            'commercial_name'    => 'required|string|max:150',
            'matrix_address'     => 'required|string|max:255',
            'branch_address'     => 'required|string|max:255',
            'province'           => 'nullable|string|max:100',
            'city'               => 'nullable|string|max:100',
            'accounting'         => 'required|boolean',
            'phone'              => 'nullable|string|max:20',
            'email'              => 'nullable|email|max:100',
            'signature'          => 'nullable|file|max:2048',
            'signature_password' => 'nullable|string|max:100',
        ]);

        // Generar UUID si no viene (aunque el modelo ya lo hace en creating)
        $enterpriseId = (string) Str::uuid();
        $validated['id'] = $enterpriseId;

        // Si suben .p12, guardarlo en storage/private/certs/{id}/
        if ($request->hasFile('signature')) {
            $dir = "certs/{$enterpriseId}";
            Storage::disk('private')->deleteDirectory($dir);
            Storage::disk('private')->makeDirectory($dir);

            $file     = $request->file('signature');
            $filename = "certificado_{$enterpriseId}.{$file->getClientOriginalExtension()}";
            $path     = $file->storeAs($dir, $filename, 'private');

            $validated['signature']          = $path;
            // Si no se envía password, lo dejamos vacío
            $validated['signature_password'] = $validated['signature_password'] ?? '';
        }

        Enterprise::create($validated);

        return redirect()->route('enterprises.index')
            ->with('success', 'Empresa creada correctamente.');
    }

    public function edit($id)
    {
        $enterprise = Enterprise::findOrFail($id);
        return Inertia::render('Enterprises/Edit', compact('enterprise'));
    }

    public function update(Request $request, $id)
    {
        $enterprise = Enterprise::findOrFail($id);

        $validated = $request->validate([
            'ruc'                => 'nullable|string|max:20',
            'name'               => 'nullable|string|max:100',
            'commercial_name'    => 'nullable|string|max:150',
            'matrix_address'     => 'nullable|string|max:255',
            'branch_address'     => 'nullable|string|max:255',
            'province'           => 'nullable|string|max:100',
            'city'               => 'nullable|string|max:100',
            'accounting'         => 'nullable|boolean',
            'phone'              => 'nullable|string|max:20',
            'email'              => 'nullable|email|max:100',
            'signature'          => 'nullable|file|max:2048',
            'signature_password' => 'nullable|string|max:100',
        ]);

        // 📦 Si se sube un nuevo certificado .p12
        if ($request->hasFile('signature')) {
            $dir = "certs/{$enterprise->id}";
            Storage::disk('private')->deleteDirectory($dir);
            Storage::disk('private')->makeDirectory($dir);

            $file     = $request->file('signature');
            $filename = "certificado_{$enterprise->id}.{$file->getClientOriginalExtension()}";
            $path     = $file->storeAs($dir, $filename, 'private');

            $validated['signature'] = $path;
            $validated['signature_password'] = $validated['signature_password'] ?? '';
        } else {
            unset($validated['signature']);
        }

        // 🔄 Solo actualiza los campos que vienen (para no sobreescribir con null)
        foreach ($validated as $key => $value) {
            if ($value !== null) {
                $enterprise->{$key} = $value;
            }
        }

        $enterprise->save();

        return redirect()->route('enterprises.index')
            ->with('success', 'Empresa actualizada correctamente.');
    }



    public function destroy($id)
    {
        $enterprise = Enterprise::findOrFail($id);
        // Borramos certificado del disco
        Storage::disk('private')->deleteDirectory("certs/{$enterprise->id}");
        $enterprise->delete();

        return redirect()->route('enterprises.index')
            ->with('success', 'Empresa eliminada correctamente.');
    }
}
