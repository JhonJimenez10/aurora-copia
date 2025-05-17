<?php

namespace App\Services;

use DOMDocument;
use DOMXPath;
use SoapClient;
use Exception;
use Illuminate\Support\Facades\Log;

class SriAuthorizationService
{
    protected string $wsdlRecepcion;
    protected string $wsdlAutorizacion;
    protected string $dirAutorizados;
    protected string $dirNoAutorizados;

    public function __construct()
    {
        $this->wsdlRecepcion     = config('sri.wsdl_recepcion');
        $this->wsdlAutorizacion  = config('sri.wsdl_autorizacion');
        $this->dirAutorizados    = config('sri.dir_autorizados');
        $this->dirNoAutorizados  = config('sri.dir_no_autorizados');
    }

    /**
     * Envía el XML firmado al SRI, guarda:
     *  - el XML "limpio" de autorización si fue AUTORIZADO
     *  - el SOAP completo si NO fue autorizado
     * y devuelve estado, mensaje y rutas a los archivos guardados.
     *
     * @param  string  $signedXmlPath  Ruta al XML previamente firmado.
     * @return array{
     *   estado: string,
     *   mensaje: string,
     *   autorizado_path?: string,
     *   no_autorizado_path?: string
     * }
     * @throws Exception
     */
    public function authorize(string $signedXmlPath): array
    {
        if (! is_file($signedXmlPath)) {
            throw new Exception("No existe el XML firmado: {$signedXmlPath}");
        }

        // 1) Recepción SRI
        $xmlContent = file_get_contents($signedXmlPath);
        $clientRec  = new SoapClient($this->wsdlRecepcion, [
            'trace'       => true,
            'exceptions'  => true,
            'cache_wsdl'  => WSDL_CACHE_NONE,
        ]);
        $respRec    = $clientRec->validarComprobante(['xml' => $xmlContent]);
        $estadoRec  = $respRec->RespuestaRecepcionComprobante->estado ?? null;

        if ($estadoRec !== 'RECIBIDA') {
            return [
                'estado'   => 'ERROR_RECEPCION',
                'mensaje'  => "SRI no recibió el comprobante: {$estadoRec}",
            ];
        }

        // 2) Extraer clave de acceso
        $domClave   = new DOMDocument;
        $domClave->load($signedXmlPath);
        $clave      = $domClave->getElementsByTagName('claveAcceso')->item(0)->nodeValue;

        // 3) Autorización SRI
        $clientAut  = new SoapClient($this->wsdlAutorizacion, [
            'trace'       => true,
            'exceptions'  => true,
            'cache_wsdl'  => WSDL_CACHE_NONE,
        ]);
        $respAut    = $clientAut->autorizacionComprobante([
            'claveAccesoComprobante' => $clave,
        ]);

        // 4) Capturar el SOAP bruto (tanto si autoriza como si no)
        $rawSoap    = $clientAut->__getLastResponse();
        $filename   = basename($signedXmlPath);

        // 5) Analizar el SOAP con DOM+XPath
        $dom   = new DOMDocument;
        $dom->loadXML($rawSoap);
        $xpath = new DOMXPath($dom);

        // Buscar el primer <autorizacion>
        $authNodes = $xpath->query("//*[local-name()='autorizacion']");
        if ($authNodes->length === 0) {
            throw new Exception("No se encontró el nodo <autorizacion> en la respuesta SRI.");
        }
        $authNode  = $authNodes->item(0);

        // Extraer estado interno
        $estadoAut = $xpath->evaluate("string(.//*[local-name()='estado'])", $authNode);

        // --- CASO AUTORIZADO ---
        if ($estadoAut === 'AUTORIZADO') {
            // Reconstruir XML limpio
            $outDoc = new DOMDocument('1.0', 'UTF-8');
            $outDoc->formatOutput = true;
            $root   = $outDoc->createElement('autorizacion');
            $outDoc->appendChild($root);

            // Campos estándar
            foreach (['estado', 'fechaAutorizacion', 'numeroAutorizacion'] as $tag) {
                $val = $xpath->evaluate("string(.//*[local-name()='{$tag}'])", $authNode);
                $root->appendChild($outDoc->createElement($tag, $val));
            }

            // Comprobante en CDATA
            $comp    = $xpath->evaluate("string(.//*[local-name()='comprobante'])", $authNode);
            $cdata   = $outDoc->createCDATASection($comp);
            $cNode   = $outDoc->createElement('comprobante');
            $cNode->appendChild($cdata);
            $root->appendChild($cNode);

            // Guardar
            if (! file_exists($this->dirAutorizados)) {
                mkdir($this->dirAutorizados, 0755, true);
            }
            $pathAuth = "{$this->dirAutorizados}/{$filename}";
            $outDoc->save($pathAuth);

            return [
                'estado'          => $estadoAut,
                'mensaje'         => 'Factura AUTORIZADA correctamente.',
                'autorizado_path' => $pathAuth,
            ];
        }

        // --- CASO NO AUTORIZADO ---
        // Guardar SOAP completo para inspección
        if (! file_exists($this->dirNoAutorizados)) {
            mkdir($this->dirNoAutorizados, 0755, true);
        }
        $pathNoAuth = "{$this->dirNoAutorizados}/{$filename}";
        file_put_contents($pathNoAuth, $rawSoap);

        // Extraer todos los mensajes de error dentro del <autorizacion>
        $mensajes = [];
        $msgNodes = $xpath->query(".//*[local-name()='mensaje']", $authNode);
        foreach ($msgNodes as $msgNode) {
            // Identificador asoci ado (si existe)
            $id = $xpath->evaluate("string(../*[local-name()='identificador'])", $msgNode);
            $txt = trim($msgNode->nodeValue);
            $mensajes[] = $id ? "[$id] $txt" : $txt;
        }

        return [
            'estado'             => $estadoAut,
            'mensaje'            => 'Rechazado por SRI: ' . implode('; ', $mensajes),
            'no_autorizado_path' => $pathNoAuth,
        ];
    }
}
