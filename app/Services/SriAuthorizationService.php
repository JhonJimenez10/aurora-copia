<?php
// app/Services/SriAuthorizationService.php

namespace App\Services;

use SoapClient;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\File;

class SriAuthorizationService
{
    protected SoapClient $recepcionClient;
    protected SoapClient $autorizacionClient;
    protected string $autorizadosDir;
    protected string $noAutorizadosDir;

    public function __construct()
    {
        $this->recepcionClient = new SoapClient(config('sri.wsdl_recepcion'));
        $this->autorizacionClient = new SoapClient(config('sri.wsdl_autorizacion'), [
            'trace' => 1,
            'exceptions' => true
        ]);

        $this->autorizadosDir = config('sri.dir_xml_autorizados');
        $this->noAutorizadosDir = config('sri.dir_xml_no_autorizados');
    }

    public function authorize(string $signedXmlPath, string $accessKey): array
    {
        if (!File::exists($signedXmlPath)) {
            throw new Exception("Archivo firmado no encontrado: {$signedXmlPath}");
        }

        $xmlContent = File::get($signedXmlPath);

        // 1) Recepción
        $recv = $this->recepcionClient->validarComprobante(['xml' => $xmlContent]);
        $estadoRecep = $recv->RespuestaRecepcionComprobante->estado ?? null;

        if ($estadoRecep !== 'RECIBIDA') {
            $errores = [];

            $comprobantes = $recv->RespuestaRecepcionComprobante->comprobantes->comprobante ?? null;
            if ($comprobantes && isset($comprobantes->mensajes->mensaje)) {
                $mensajes = $comprobantes->mensajes->mensaje;
                $mensajes = is_array($mensajes) ? $mensajes : [$mensajes];

                foreach ($mensajes as $msg) {
                    if (is_object($msg)) {
                        $errores[] = "[{$msg->identificador}] {$msg->mensaje}"
                            . (!empty($msg->informacionAdicional) ? " ({$msg->informacionAdicional})" : '');
                    }
                }
            }

            $detalle = $errores ? implode('; ', $errores) : 'Sin detalle del SRI.';
            throw new Exception("SRI Recepción: {$estadoRecep}. {$detalle}");
        }

        // 2) Autorización con reintentos
        $authData = null;
        $maxAttempts = 3;
        $attempt = 0;

        while ($attempt < $maxAttempts && !$authData) {
            $attempt++;
            try {
                $authResp = $this->autorizacionClient->autorizacionComprobante([
                    'claveAccesoComprobante' => $accessKey
                ]);
            } catch (\Exception $e) {
                Log::warning("Error en intento {$attempt} de autorización para clave {$accessKey}: {$e->getMessage()}");
                sleep(1);
                continue;
            }

            $authData = $authResp->RespuestaAutorizacionComprobante->autorizaciones->autorizacion ?? null;

            if (!$authData) {
                Log::warning("Intento {$attempt} fallido de autorización SRI para clave {$accessKey}: respuesta sin autorización");
                sleep(1);
            }
        }

        if (!$authData || !isset($authData->estado)) {
            $rejPath = $this->noAutorizadosDir . DIRECTORY_SEPARATOR . "{$accessKey}-NO-RESPONSE.xml";
            File::put($rejPath, $this->autorizacionClient->__getLastResponse());
            throw new Exception("SRI: No se recibió respuesta de autorización tras {$maxAttempts} intentos.");
        }

        $estado = $authData->estado;

        if ($estado !== 'AUTORIZADO') {
            if (!File::isDirectory($this->noAutorizadosDir)) {
                File::makeDirectory($this->noAutorizadosDir, 0755, true);
            }

            $rejPath = $this->noAutorizadosDir . DIRECTORY_SEPARATOR . "{$accessKey}-{$estado}.xml";
            File::put($rejPath, $this->autorizacionClient->__getLastResponse());

            $errores = [];
            $mensajes = $authData->mensajes->mensaje ?? null;
            $mensajes = is_array($mensajes) ? $mensajes : [$mensajes];

            foreach ($mensajes as $m) {
                if (is_object($m)) {
                    $errores[] = "[{$m->identificador}] {$m->mensaje}"
                        . (!empty($m->informacionAdicional) ? " ({$m->informacionAdicional})" : '');
                }
            }

            $detalle = $errores ? implode('; ', $errores) : 'Respuesta sin mensajes detallados.';
            throw new Exception("SRI Autorización: {$estado}. {$detalle}");
        }

        // Guardar XML autorizado
        if (!File::isDirectory($this->autorizadosDir)) {
            File::makeDirectory($this->autorizadosDir, 0755, true);
        }

        $okPath = $this->autorizadosDir . DIRECTORY_SEPARATOR . "{$accessKey}.xml";
        File::put($okPath, $this->autorizacionClient->__getLastResponse());

        return [
            'path' => $okPath,
            'response' => $authResp,
        ];
    }
}
