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
        // 1) Recupera la empresa
        $enterprise = Enterprise::findOrFail($id);

        // 2) Valida sólo el certificado y la contraseña
        $validated = $request->validate([
            'signature'          => 'required|file|max:2048',
            'signature_password' => 'nullable|string|max:100',
        ]);

        // 3) Borra el certificado anterior (si existe)
        if ($enterprise->signature) {
            Storage::disk('private')->delete($enterprise->signature);
        }

        // 4) Prepara carpeta nueva
        $dir = "certs/{$enterprise->id}";
        Storage::disk('private')->deleteDirectory($dir);
        Storage::disk('private')->makeDirectory($dir);

        // 5) Guarda el nuevo .p12
        $file     = $request->file('signature');
        $filename = "certificado_{$enterprise->id}.{$file->getClientOriginalExtension()}";
        $path     = $file->storeAs($dir, $filename, 'private');

        // 6) Actualiza en la BD la ruta y la password
        $enterprise->update([
            'signature'          => $path,
            'signature_password' => $validated['signature_password'] ?? '',
        ]);

        // 7) Redirige con mensaje
        return redirect()
            ->route('enterprises.index')
            ->with('success', 'Certificado eliminado y reemplazado correctamente.');
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
