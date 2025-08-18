<?php

namespace App\Http\Controllers;

use App\Models\Reception;
use App\Models\Invoice;
use App\Models\InvDetail;
use App\Models\ArtPackg;
use App\Services\SriAuthorizationService;
use App\Services\XmlSignerService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use App\Services\SriFacturaXmlService;
use Carbon\Carbon;

class InvoiceController extends Controller
{
    /**
     * Genera la factura, sus detalles y el XML.
     */
    public function createInvoice($receptionId): JsonResponse
    {
        DB::beginTransaction();

        try {
            // 1) Cargar datos de recepción
            $reception    = Reception::with(['packages.items', 'additionals'])->findOrFail($receptionId);
            $enterpriseId = Auth::user()->enterprise_id;

            // ✅ Validar que la recepción pertenezca a la empresa logueada
            if ($reception->enterprise_id !== $enterpriseId) {
                return response()->json([
                    'error' => 'No autorizado para facturar esta recepción.',
                    'message' => 'La recepción no pertenece a su empresa.'
                ], 403);
            }

            // 2) Calcular secuencial y número
            $establishment = '001';
            $emissionPoint = '001';

            $lastInvoice = Invoice::where('enterprise_id', $enterpriseId)
                ->orderByDesc('sequential')
                ->lockForUpdate()
                ->first();

            $sequential = $lastInvoice ? $lastInvoice->sequential + 1 : 1;

            $number = sprintf('%s-%s-%09d', $establishment, $emissionPoint, $sequential);

            // 3) Crear encabezado de factura
            $invoice = Invoice::create([
                'id'             => Str::uuid(),
                'enterprise_id'  => $enterpriseId,
                'sender_id'      => $reception->sender_id,
                'reception_id'   => $reception->id,
                'establishment'  => $establishment,
                'emission_point' => $emissionPoint,
                'sequential'     => $sequential,
                'number'         => $number,
                'invoice_type'   => 'FE',
                'issue_date'     => now()->toDateString(),
                'subtotal'       => $reception->subtotal,
                'discount'       => 0,
                'vat'            => $reception->vat15,
                'total'          => $reception->total,
                'sri_status'     => 'GENERATED',
                'access_key'     => Str::uuid(),
                'auth_number'    => null,
                'auth_date'      => null,
                'observations'   => null,
                'xml_url'        => null,
                'auth_xml_url'   => null,
            ]);

            // 4) Detalles de paquetes
            foreach ($reception->packages as $pkg) {
                $qty = collect($pkg->items)->sum('quantity');
                $unitPrice = $qty ? round($pkg->total / $qty, 2) : round($pkg->total, 2);
                $subtotal  = round($unitPrice * $qty, 2);
                $vatAmount = round($subtotal * 0.15, 2);

                InvDetail::create([
                    'id'          => Str::uuid(),
                    'invoice_id'  => $invoice->id,
                    'description' => $pkg->content ?? 'Paquete',
                    'quantity'    => $qty,
                    'unit_price'  => $unitPrice,
                    'subtotal'    => $subtotal,
                    'vat'         => $vatAmount,
                    'total'       => round($subtotal + $vatAmount, 2),
                ]);
            }

            // 5) Detalles de adicionales
            foreach ($reception->additionals as $add) {
                $article     = ArtPackg::find($add->art_packg_id);
                $description = $article->name ?? 'Adicional';
                $qty         = $add->quantity ?? 1;
                $unitPrice   = $add->unit_price;
                $subtotal    = round($qty * $unitPrice, 2);
                $vatAmount   = round($subtotal * 0.15, 2);

                InvDetail::create([
                    'id'          => Str::uuid(),
                    'invoice_id'  => $invoice->id,
                    'description' => $description,
                    'quantity'    => $qty,
                    'unit_price'  => $unitPrice,
                    'subtotal'    => $subtotal,
                    'vat'         => $vatAmount,
                    'total'       => round($subtotal + $vatAmount, 2),
                ]);
            }

            DB::commit();

            // 6) Generar XML
            $xmlService = new SriFacturaXmlService();
            $result     = $xmlService->generate($invoice);
            $xmlPath    = $result['xml_path'];
            $claveAcceso = $result['claveAcceso'];
            $invoice->update([
                'access_key' => $claveAcceso,
                'sri_status' => 'GENERATED',
            ]);

            // 7) Firmar el XML
            $signer        = new XmlSignerService();
            $signedXmlPath = $signer->sign($xmlPath, $invoice->id);
            $invoice->update(['xml_url' => $signedXmlPath]);

            // 8) Autorizar en el SRI
            $authorizer = new SriAuthorizationService();
            $maxAttempts = 3;
            $authorized = false;
            $attempt = 0;
            $authResult = null;
            $authResp = null;

            while (! $authorized && $attempt < $maxAttempts) {
                try {
                    $authResult = $authorizer->authorize($signedXmlPath, $claveAcceso);
                    $authResp = $authResult['response']
                        ->RespuestaAutorizacionComprobante
                        ->autorizaciones
                        ->autorizacion;
                    $authorized = true;
                } catch (\Exception $e) {
                    $attempt++;
                    Log::warning("Intento {$attempt} fallido de autorización SRI para factura {$invoice->number}: {$e->getMessage()}");
                    sleep(1);
                }
            }

            if ($authorized && isset($authResp->numeroAutorizacion)) {
                $invoice->update([
                    'auth_xml_url' => $authResult['path'],
                    'auth_number'  => $authResp->numeroAutorizacion,
                    'auth_date'    => Carbon::parse($authResp->fechaAutorizacion),
                    'sri_status'   => 'AUTHORIZED',
                ]);

                return response()->json([
                    'status'         => 'autorizado',
                    'message'        => 'Factura generada, firmada y autorizada correctamente.',
                    'xml_firmado'    => $signedXmlPath,
                    'xml_autorizado' => $authResult['path'],
                    'invoice_id'     => $invoice->id,
                    'invoice_number' => $invoice->number,
                ], 201);
            } else {
                $invoice->update([
                    'sri_status' => 'SIGNED',
                    'auth_number' => null,
                    'auth_date'   => null,
                ]);

                return response()->json([
                    'status'      => 'error',
                    'message'     => 'Factura firmada pero no autorizada por el SRI. Intente nuevamente más tarde.',
                    'invoice_id'  => $invoice->id,
                    'xml_firmado' => $signedXmlPath,
                ], 202);
            }
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error("createInvoice error (receptionId={$receptionId}): {$e->getMessage()}", [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error'   => 'Error al crear factura',
                'details' => $e->getMessage(),
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retorna el PDF inline.
     */
    public function pdf($invoiceId)
    {
        $invoice = Invoice::with(['sender', 'enterprise', 'invDetails', 'reception'])
            ->findOrFail($invoiceId);

        $pdf = Pdf::loadView('pdfs.invoice', compact('invoice'));

        return $pdf->stream("factura-{$invoice->number}.pdf");
    }

    /**
     * Descarga el XML ya generado.
     */
    public function downloadXml($invoiceId): BinaryFileResponse|JsonResponse
    {
        try {
            $invoice = Invoice::findOrFail($invoiceId);
            $path    = $invoice->xml_url;

            if (! $path || ! is_file($path)) {
                throw new \Exception("XML no encontrado en: {$path}");
            }

            return response()->download(
                $path,
                "factura-{$invoice->number}.xml",
                ['Content-Type' => 'application/xml']
            );
        } catch (\Exception $e) {
            Log::error("downloadXml error (invoiceId={$invoiceId}): {$e->getMessage()}");

            return response()->json([
                'error'   => 'Error al descargar el XML',
                'details' => $e->getMessage(),
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
    public function generateTicket($invoiceId)
    {
        $invoice = Invoice::with([
            'enterprise',
            'sender',
            'reception.recipient',
            'reception.agencyDest',
            'reception.packages.packageItems',
            'invDetails'
        ])->findOrFail($invoiceId);

        $reception = $invoice->reception;

        // Resumen de paquetes
        $weight = $reception->packages->sum('pounds');
        $declaredValue = $reception->packages->sum('decl_val');
        $contentDescription = $reception->packages->pluck('content')->filter()->implode(' + ');
        $tarifaPaquetes = $reception->packages->sum(function ($package) {
            return $package->packageItems->sum(function ($item) {
                return $item->quantity * $item->unit_price;
            });
        });

        // Adicionales
        $totalSeguroPaquetes   = $reception->ins_pkg;
        $totalEmbalaje         = $reception->packaging;
        $totalSeguroEnvio      = $reception->ship_ins;
        $totalDesaduanizacion  = $reception->clearance;
        $totalTransporteDestino = $reception->trans_dest;
        $totalTransmision      = $reception->transmit;

        // Subtotales
        $subtotal15 = $invoice->subtotal;
        $subtotal0  = 0;

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdfs.ticket_invoice', [
            'invoice' => $invoice,
            'weight'  => $weight,
            'declaredValue' => $declaredValue,
            'contentDescription' => $contentDescription,
            'total_seguro_paquetes' => $totalSeguroPaquetes,
            'total_embalaje' => $totalEmbalaje,
            'total_seguro_envio' => $totalSeguroEnvio,
            'total_desaduanizacion' => $totalDesaduanizacion,
            'total_transporte_destino' => $totalTransporteDestino,
            'total_transmision' => $totalTransmision,
            'subtotal_0' => $subtotal0,
            'subtotal_15' => $subtotal15,
            'vat' => $invoice->vat,
            'total' => $invoice->total,
            'tarifa_paquetes' => $tarifaPaquetes,

            // === NUEVO: 2 páginas (2 copias) ===
            'copies' => 2,
            // Etiquetas opcionales por copia (puedes cambiar o quitar)
            'copy_labels' => ['ORIGINAL', 'COPIA'],
        ]);

        return $pdf->stream('ticket-' . $invoice->number . '.pdf');
    }

    /**
     * NUEVO: Genera el PDF A4 horizontal (impresora normal).
     */
    // SIN cambiar el nombre del método ni la ruta ni el botón
    public function generateA4($invoiceId)
    {
        $invoice = Invoice::with([
            'enterprise',
            'sender',
            'reception.recipient',
            'reception.agencyDest',
            'reception.packages.packageItems',
            'invDetails'
        ])->findOrFail($invoiceId);

        $data = $this->buildInvoicePdfData($invoice);

        // Ahora por defecto va ARRIBA. Si quieres abajo en algún momento: ?pos=bottom
        $data['position'] = request()->get('pos', 'top');  // 'top' | 'bottom'

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdfs.a4_invoice', $data)
            ->setPaper('A4', 'portrait');

        return $pdf->stream('factura-' . $invoice->number . '-A4.pdf');
    }


    /**
     * Helper: prepara los datos que consumen las vistas de PDF (ticket y A4).
     */
    private function buildInvoicePdfData(Invoice $invoice): array
    {
        $reception = $invoice->reception;

        // Resumen de paquetes
        $weight            = (float) ($reception->packages->sum('pounds') ?? 0);
        $declaredValue     = (float) ($reception->packages->sum('decl_val') ?? 0);
        $contentDescription = $reception->packages->pluck('content')->filter()->implode(' + ') ?? '';

        // Tarifa por paquetes (suma de items)
        $tarifaPaquetes = $reception->packages->sum(function ($package) {
            return $package->packageItems->sum(function ($item) {
                return (float) $item->quantity * (float) $item->unit_price;
            });
        });

        // Adicionales
        $totalSeguroPaquetes   = (float) ($reception->ins_pkg     ?? 0);
        $totalEmbalaje         = (float) ($reception->packaging   ?? 0);
        $totalSeguroEnvio      = (float) ($reception->ship_ins    ?? 0);
        $totalDesaduanizacion  = (float) ($reception->clearance   ?? 0);
        $totalTransporteDestino = (float) ($reception->trans_dest  ?? 0);
        $totalTransmision      = (float) ($reception->transmit    ?? 0);

        // Subtotales e impuestos
        $subtotal15 = (float) ($invoice->subtotal ?? 0);
        $subtotal0  = (float) (property_exists($invoice, 'subtotal_0') ? ($invoice->subtotal_0 ?? 0) : 0);
        $vat        = (float) ($invoice->vat ?? 0);
        $total      = (float) ($invoice->total ?? 0);

        return [
            'invoice' => $invoice,
            'weight' => $weight,
            'declaredValue' => $declaredValue,
            'contentDescription' => $contentDescription,

            'tarifa_paquetes' => $tarifaPaquetes,

            'total_seguro_paquetes' => $totalSeguroPaquetes,
            'total_embalaje' => $totalEmbalaje,
            'total_seguro_envio' => $totalSeguroEnvio,
            'total_desaduanizacion' => $totalDesaduanizacion,
            'total_transporte_destino' => $totalTransporteDestino,
            'total_transmision' => $totalTransmision,

            'subtotal_0' => $subtotal0,
            'subtotal_15' => $subtotal15,
            'vat' => $vat,
            'total' => $total,
        ];
    }
}
