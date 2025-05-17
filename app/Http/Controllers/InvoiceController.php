<?php

namespace App\Http\Controllers;

use App\Models\Reception;
use App\Models\Invoice;
use App\Models\InvDetail;
use App\Models\ArtPackg;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use App\Services\SriFacturaXmlService;

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
            $reception    = Reception::with(['packages', 'additionals'])->findOrFail($receptionId);
            $enterpriseId = Auth::user()->enterprise_id;

            // 2) Calcular secuencial y número
            $last = Invoice::where('enterprise_id', $enterpriseId)
                ->orderByDesc('sequential')
                ->first();

            $sequential = $last ? $last->sequential + 1 : 1;
            $establishment = '001';
            $emissionPoint = '001';
            $number        = sprintf('%s-%s-%09d', $establishment, $emissionPoint, $sequential);


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
                $qty       = $pkg->quantity ?? 1;
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

            // 6) Generación del XML (sin firma ni autorización)
            $xmlService = new SriFacturaXmlService();
            $result = $xmlService->generate($invoice);
            $xmlPath = $result['xml_path'];

            // 7) Guardar ruta del XML generado
            $invoice->update(['xml_url' => $xmlPath]);

            // 8) Responder al frontend
            return response()->json([
                'status'         => 'generado',
                'message'        => 'Factura generada y XML listo para descarga.',
                'xml_autorizado' => $xmlPath,
                'invoice_id'     => $invoice->id,
                'invoice_number' => $invoice->number,
            ], 201);
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
}
