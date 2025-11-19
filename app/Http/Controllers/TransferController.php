<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class TransferController extends Controller
{
    /**
     * Pantalla "Elaborar traslado"
     */
    public function create()
    {
        // Más adelante aquí pasaremos countries, agencies, etc.
        return Inertia::render('Transfers/Create');
        // ↳ Debe coincidir EXACTAMENTE con resources/js/Pages/Transfers/Create.tsx
    }
}
