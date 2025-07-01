<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

// Imports de los módulos
use App\Imports\SendersImport;
use App\Imports\RecipientsImport;
use App\Imports\ArtPackagesImport;
use App\Imports\ArtPackgsImport;
use App\Imports\AgenciesDestImport; // al inicio


class BulkImportController extends Controller
{
    public function viewByType($type)
    {
        if (!in_array($type, ['senders', 'recipients', 'art_packages', 'art_packgs', 'agencies_dest'])) {
            abort(404);
        }

        return Inertia::render('BulkImport/Index', [
            'type' => $type,
        ]);
    }

    public function downloadExample($type)
    {
        $filename = $type . '_example.xlsx';
        $path = storage_path("app/examples/{$filename}");

        if (!file_exists($path)) {
            return response()->json(['error' => 'Archivo no encontrado'], 404);
        }

        return response()->download($path, "ejemplo_{$type}.xlsx");
    }

    public function importData(Request $request, $type)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls',
        ]);

        $enterpriseId = auth()->user()->enterprise_id;

        switch ($type) {
            case 'senders':
                Excel::import(new SendersImport($enterpriseId), $request->file('file'));
                break;
            case 'recipients':
                Excel::import(new RecipientsImport($enterpriseId), $request->file('file'));
                break;
            case 'art_packages':
                Excel::import(new ArtPackagesImport($enterpriseId), $request->file('file'));
                break;
            case 'art_packgs':
                Excel::import(new ArtPackgsImport($enterpriseId), $request->file('file'));
                break;
            // Dentro de importData():
            case 'agencies_dest':
                Excel::import(new AgenciesDestImport($enterpriseId), $request->file('file'));
                break;
            default:
                return back()->with('error', 'Importador no implementado para este módulo.');
        }

        return back()->with('success', 'Datos importados correctamente.');
    }
}
