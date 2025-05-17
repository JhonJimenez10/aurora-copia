<?php

namespace App\Http\Controllers;

use App\Models\PackageItem;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PackageItemController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'package_id' => 'required|uuid|exists:packages,id',
            'items' => 'required|array',
            'items.*.art_package_id' => 'nullable|uuid|exists:art_packages,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit' => 'nullable|string|max:50',
            'items.*.volume' => 'boolean',
            'items.*.length' => 'nullable|numeric',
            'items.*.width' => 'nullable|numeric',
            'items.*.height' => 'nullable|numeric',
            'items.*.weight' => 'nullable|numeric',
            'items.*.pounds' => 'nullable|numeric',
            'items.*.kilograms' => 'nullable|numeric',
            'items.*.unit_price' => 'nullable|numeric',
            'items.*.total' => 'nullable|numeric',
            'items.*.decl_val' => 'nullable|numeric',
            'items.*.ins_val' => 'nullable|numeric',
        ]);

        foreach ($validated['items'] as $itemData) {
            \App\Models\PackageItem::create(array_merge($itemData, [
                'package_id' => $validated['package_id'],
            ]));
        }

        return response()->json(['message' => 'Items stored successfully']);
    }
}
