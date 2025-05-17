<?php

namespace App\Http\Controllers;

use App\Models\Package;
use App\Models\Reception;
use App\Models\ArtPackage;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PackageController extends Controller
{
    public function index()
    {
        $packages = Package::with('reception', 'artPackage')->get();

        return Inertia::render('Package/Index', [
            'packages' => $packages,
        ]);
    }

    public function create()
    {
        return Inertia::render('Package/Create', [
            'receptions'  => Reception::all(['id', 'number']),
            'artPackages' => ArtPackage::all(['id', 'name']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'reception_id'   => 'required|uuid',
            'art_package_id' => 'nullable|uuid',
            'service_type'   => 'required|string|max:50',
            'content'        => 'nullable|string|max:255',
            'pounds'         => 'required|numeric',
            'kilograms'      => 'required|numeric',
            'total'          => 'required|numeric',
            'decl_val'       => 'required|numeric',
            'ins_val'        => 'required|numeric',
            'barcode'        => 'nullable|string|max:30',
        ]);

        Package::create($validated);

        return redirect()->route('packages.index')->with('success', 'Package created successfully.');
    }

    public function edit($id)
    {
        $package = Package::findOrFail($id);

        return Inertia::render('Package/Edit', [
            'package'     => $package,
            'receptions'  => Reception::all(['id', 'number']),
            'artPackages' => ArtPackage::all(['id', 'name']),
        ]);
    }

    public function update(Request $request, $id)
    {
        $package = Package::findOrFail($id);

        $validated = $request->validate([
            'reception_id'   => 'sometimes|required|uuid',
            'art_package_id' => 'nullable|uuid',
            'service_type'   => 'sometimes|required|string|max:50',
            'content'        => 'sometimes|nullable|string|max:255',
            'pounds'         => 'sometimes|required|numeric',
            'kilograms'      => 'sometimes|required|numeric',
            'total'          => 'sometimes|required|numeric',
            'decl_val'       => 'sometimes|required|numeric',
            'ins_val'        => 'sometimes|required|numeric',
            'barcode'        => 'nullable|string|max:30',
        ]);

        $package->update($validated);

        return redirect()->route('packages.index')->with('success', 'Package updated successfully.');
    }

    public function destroy($id)
    {
        $package = Package::findOrFail($id);
        $package->delete();

        return redirect()->route('packages.index')->with('success', 'Package deleted successfully.');
    }
}
