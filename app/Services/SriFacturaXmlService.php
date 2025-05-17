<?php

namespace App\Services;

use App\Models\Invoice;
use Carbon\Carbon;
use DOMDocument;
use Illuminate\Support\Facades\Log;

class SriFacturaXmlService
{
    public function generate(Invoice $invoice): array
    {
        $claveAcceso = $this->generateAccessKey($invoice);

        // NUEVA ruta: C:\facturas\facturas
        $xmlDir = 'C:/facturas/facturas';
        if (!file_exists($xmlDir)) {
            mkdir($xmlDir, 0755, true);
        }

        $xmlPath = "{$xmlDir}/{$claveAcceso}.xml";

        try {
            $xml = new DOMDocument('1.0', 'UTF-8');
            $xml->formatOutput = true;

            $root = $xml->createElement('factura');
            $root->setAttribute('id', 'comprobante');
            $root->setAttribute('version', '1.0.0');
            $xml->appendChild($root);

            // infoTributaria
            $infoTrib = $xml->createElement('infoTributaria');
            $dataTrib = [
                'ambiente'        => config('sri.ambiente', '1'),
                'tipoEmision'     => config('sri.tipo_emision', '1'),
                'razonSocial'     => $invoice->enterprise->name,
                'nombreComercial' => $invoice->enterprise->commercial_name,
                'ruc'             => str_pad($invoice->enterprise->ruc, 13, '0', STR_PAD_LEFT),
                'claveAcceso'     => $claveAcceso,
                'codDoc'          => '01',
                'estab'           => $invoice->establishment,
                'ptoEmi'          => $invoice->emission_point,
                'secuencial'      => str_pad($invoice->sequential, 9, '0', STR_PAD_LEFT),
                'dirMatriz'       => $invoice->enterprise->matrix_address,
            ];
            foreach ($dataTrib as $tag => $val) {
                $infoTrib->appendChild($xml->createElement($tag, $val));
            }
            $root->appendChild($infoTrib);

            // infoFactura
            $infoFac = $xml->createElement('infoFactura');
            $fechaEmision = Carbon::parse($invoice->issue_date)->format('d/m/Y');
            $dataFac = [
                'fechaEmision'                => $fechaEmision,
                'dirEstablecimiento'         => $invoice->enterprise->branch_address,
                'obligadoContabilidad'       => $invoice->enterprise->accounting ? 'SI' : 'NO',
                'tipoIdentificacionComprador' => $this->mapIdType($invoice->sender->id_type),
                'razonSocialComprador'       => $invoice->sender->full_name,
                'identificacionComprador'    => $invoice->sender->identification,
                'direccionComprador'         => $invoice->sender->address,
                'totalSinImpuestos'          => number_format($invoice->subtotal, 2, '.', ''),
                'totalDescuento'             => number_format($invoice->discount, 2, '.', ''),
            ];
            foreach ($dataFac as $tag => $val) {
                $infoFac->appendChild($xml->createElement($tag, $val));
            }

            // totalConImpuestos
            $tConImp = $xml->createElement('totalConImpuestos');
            $imp = $xml->createElement('totalImpuesto');
            $impData = [
                'codigo'           => '2',
                'codigoPorcentaje' => '4',
                'baseImponible'    => number_format($invoice->subtotal, 2, '.', ''),
                'valor'            => number_format($invoice->vat, 2, '.', ''),
            ];
            foreach ($impData as $tag => $val) {
                $imp->appendChild($xml->createElement($tag, $val));
            }
            $tConImp->appendChild($imp);
            $infoFac->appendChild($tConImp);
            $infoFac->appendChild($xml->createElement('propina', '0.00'));
            $infoFac->appendChild($xml->createElement('importeTotal', number_format($invoice->total, 2, '.', '')));
            $infoFac->appendChild($xml->createElement('moneda', 'DOLAR'));

            // pagos
            $pagos = $xml->createElement('pagos');
            $pago = $xml->createElement('pago');
            $pago->appendChild($xml->createElement('formaPago', $this->mapPayMethod($invoice->pay_method)));
            $pago->appendChild($xml->createElement('total', number_format($invoice->total, 2, '.', '')));
            $pagos->appendChild($pago);
            $infoFac->appendChild($pagos);

            $root->appendChild($infoFac);

            // detalles
            $detalles = $xml->createElement('detalles');
            foreach ($invoice->invDetails as $d) {
                $detalle = $xml->createElement('detalle');

                // 🆕 Código aleatorio temporal
                $codigo = 'PCK-' . str_pad(rand(0, 9999), 4, '0', STR_PAD_LEFT);

                $detalle->appendChild($xml->createElement('codigoPrincipal', $codigo));
                $detalle->appendChild($xml->createElement('descripcion', $d->description));
                $detalle->appendChild($xml->createElement('cantidad', number_format($d->quantity, 2, '.', '')));
                $detalle->appendChild($xml->createElement('precioUnitario', number_format($d->unit_price, 2, '.', '')));
                $detalle->appendChild($xml->createElement('descuento', '0.00'));
                $detalle->appendChild($xml->createElement('precioTotalSinImpuesto', number_format($d->subtotal, 2, '.', '')));

                $imps = $xml->createElement('impuestos');
                $impDet = $xml->createElement('impuesto');
                $impDet->appendChild($xml->createElement('codigo', '2'));
                $impDet->appendChild($xml->createElement('codigoPorcentaje', '4'));
                $impDet->appendChild($xml->createElement('tarifa', '15.00'));
                $impDet->appendChild($xml->createElement('baseImponible', number_format($d->subtotal, 2, '.', '')));
                $impDet->appendChild($xml->createElement('valor', number_format($d->vat, 2, '.', '')));
                $imps->appendChild($impDet);
                $detalle->appendChild($imps);

                $detalles->appendChild($detalle);
            }
            $root->appendChild($detalles);

            // infoAdicional
            $infoAd = $xml->createElement('infoAdicional');
            if ($invoice->enterprise->phone) {
                $tel = $xml->createElement('campoAdicional', $invoice->enterprise->phone);
                $tel->setAttribute('nombre', 'Telefono');
                $infoAd->appendChild($tel);
            }
            if ($invoice->enterprise->email) {
                $mail = $xml->createElement('campoAdicional', $invoice->enterprise->email);
                $mail->setAttribute('nombre', 'Email');
                $infoAd->appendChild($mail);
            }
            $root->appendChild($infoAd);

            $xml->save($xmlPath);

            $invoice->update(['xml_url' => $xmlPath]);
        } catch (\Exception $e) {
            Log::error("Error generando XML ({$claveAcceso}): " . $e->getMessage());
            throw $e;
        }

        return [
            'xml_path' => $xmlPath,
            'access_key' => $claveAcceso,
        ];
    }

    protected function mapIdType(string $type): string
    {
        return match (strtoupper($type)) {
            'RUC' => '04',
            'CEDULA' => '05',
            default => '07',
        };
    }

    protected function mapPayMethod(?string $method): string
    {
        return $method === 'EFECTIVO' ? '20' : '19';
    }

    protected function generateAccessKey(Invoice $inv): string
    {
        $date = now()->format('dmY');
        $tipoComp = '01';
        $ruc = str_pad($inv->enterprise->ruc, 13, '0', STR_PAD_LEFT);
        $ambi = config('sri.ambiente', '1');
        $serie = $inv->establishment . $inv->emission_point;
        $seq = str_pad($inv->sequential, 9, '0', STR_PAD_LEFT);
        $codNum = str_pad(mt_rand(1, 99999999), 8, '0', STR_PAD_LEFT);
        $tipoEmi = config('sri.tipo_emision', '1');

        $raw = $date . $tipoComp . $ruc . $ambi . $serie . $seq . $codNum . $tipoEmi;
        $dv = $this->calculateVerificationDigit($raw);

        return $raw . $dv;
    }

    protected function calculateVerificationDigit(string $key): int
    {
        $mult = [2, 3, 4, 5, 6, 7];
        $sum = 0;
        $len = strlen($key);
        for ($i = 0; $i < $len; $i++) {
            $sum += intval($key[$len - 1 - $i]) * $mult[$i % count($mult)];
        }
        $mod = $sum % 11;
        $dv = $mod === 0 ? 0 : 11 - $mod;
        return $dv === 10 ? 1 : $dv;
    }
}
