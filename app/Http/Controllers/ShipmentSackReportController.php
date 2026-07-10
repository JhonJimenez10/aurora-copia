<?php

namespace App\Http\Controllers;

use App\Exports\ShipmentSackReportExport;
use App\Models\Shipment;
use App\Models\ShipmentSack;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class ShipmentSackReportController extends Controller
{
    /**
     * Carga la saca del embarque ya validando que pertenece a la empresa
     * del usuario autenticado, con todo lo necesario para el reporte.
     */
    protected function loadShipmentSack(string $shipmentId, string $shipmentSackId): ShipmentSack
    {
        $enterpriseId = auth()->user()->enterprise_id;

        // Verifica que el embarque exista y sea de la empresa del usuario
        Shipment::where('enterprise_id', $enterpriseId)->findOrFail($shipmentId);

        return ShipmentSack::where('shipment_id', $shipmentId)
            ->where('id', $shipmentSackId)
            ->with([
                'shipment',
                'transferSack.sackPackages' => function ($q) {
                    $q->where('confirmed', true)
                      ->with([
                          'package.reception.sender',
                          'package.reception.recipient',
                          'package.reception.agencyDest',
                      ]);
                },
            ])
            ->firstOrFail();
    }

    /**
     * PDF de resumen de una saca, filtrado por una agencia destino específica.
     * GET /shipments/{shipment}/sacks/{shipmentSack}/report/pdf?agency_dest_id=...
     */
    public function pdf(Request $request, string $shipmentId, string $shipmentSackId)
    {
        $request->validate([
            'agency_dest_id' => 'required|uuid',
        ]);

        $shipmentSack = $this->loadShipmentSack($shipmentId, $shipmentSackId);
        $agencyDestId = $request->query('agency_dest_id');

        $sackPackages = $shipmentSack->transferSack->sackPackages
            ->filter(fn($sp) => $sp->package?->reception?->agency_dest === $agencyDestId)
            ->values();

        if ($sackPackages->isEmpty()) {
            abort(404, 'No hay paquetes para esta agencia destino en esta saca.');
        }

        $agencyDest = $sackPackages->first()->package->reception->agencyDest;

        $totalPounds    = (float) $sackPackages->sum(fn($sp) => (float) $sp->pounds);
        $totalKilograms = (float) $sackPackages->sum(fn($sp) => (float) $sp->kilograms);

        $shipment = $shipmentSack->shipment;

        $pdf = Pdf::loadView('pdfs.shipment_sack_report', [
            'shipment'       => $shipment,
            'shipmentSack'   => $shipmentSack,
            'agencyDest'     => $agencyDest,
            'sackPackages'   => $sackPackages,
            'totalPounds'    => $totalPounds,
            'totalKilograms' => $totalKilograms,
        ]);

        $sackLabel = ($shipment->sack_prefix ?? '') . $shipmentSack->sack_number;
        $agencyLabel = str_replace(' ', '_', $agencyDest->name ?? 'agencia');
        $fileName = "saca_{$sackLabel}_{$agencyLabel}.pdf";

        // "stream" para que se abra directamente en el navegador (listo para imprimir)
        return $pdf->stream($fileName);
    }

    /**
     * Excel de resumen de una saca, filtrado por una agencia destino específica.
     * GET /shipments/{shipment}/sacks/{shipmentSack}/report/excel?agency_dest_id=...
     */
    public function excel(Request $request, string $shipmentId, string $shipmentSackId)
    {
        $request->validate([
            'agency_dest_id' => 'required|uuid',
        ]);

        // Solo para validar pertenencia a la empresa antes de generar el archivo
        $shipmentSack = $this->loadShipmentSack($shipmentId, $shipmentSackId);
        $agencyDestId = $request->query('agency_dest_id');

        $sackLabel = ($shipmentSack->shipment->sack_prefix ?? '') . $shipmentSack->sack_number;
        $fileName = "saca_{$sackLabel}_reporte.xlsx";

        return Excel::download(
            new ShipmentSackReportExport($shipmentSackId, $agencyDestId),
            $fileName
        );
    }
}