<?php

use App\Models\AgencyDest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/agencies-dest/{id}', function ($id) {
    $agency = AgencyDest::find($id);

    if (!$agency) {
        return response()->json(['message' => 'Agencia no encontrada'], 404);
    }

    return response()->json($agency);
});
