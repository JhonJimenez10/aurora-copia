<?php
// app/Services/SriAuthorizationService.php

namespace App\Services;

use SoapClient;
use SoapFault;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\File;
use Carbon\Carbon;

class SriAuthorizationService
{
    protected SoapClient $recepcionClient;
    protected SoapClient $autorizacionClient;
    protected string     $autorizadosDir;

    protected string $noAutorizadosDir;

    public function __construct()
    {
        $this->recepcionClient    = new \SoapClient(config('sri.wsdl_recepcion'));
        $this->autorizacionClient = new \SoapClient(
            config('sri.wsdl_autorizacion'),
            ['trace' => 1, 'exceptions' => true]
        );

        $this->autorizadosDir    = config('sri.autorizados_dir')
            ?: storage_path('app/autorizados');
        $this->noAutorizadosDir  = config('sri.no_autorizados_dir')
            ?: storage_path('app/no_autorizados');
    }

    /**
     * Envía el XML firmado al SRI y retorna ruta + objeto de respuesta.
     *
     * @param  string $signedXmlPath
     * @param  string $accessKey
     * @return array  ['path' => string, 'response' => stdClass]
     * @throws Exception
     */
    public function authorize(string $signedXmlPath, string $accessKey): array
    {
        if (! File::exists($signedXmlPath)) {
            throw new Exception("Archivo firmado no encontrado: {$signedXmlPath}");
        }

        $xmlContent = File::get($signedXmlPath);

        // 1) Recepción
        $recv = $this->recepcionClient->validarComprobante(['xml' => $xmlContent]);
        $estadoRecep = $recv->RespuestaRecepcionComprobante->estado;
        if ($estadoRecep !== 'RECIBIDA') {
            throw new Exception("SRI Recepción: {$estadoRecep}");
        }

        // 2) Autorización con reintentos
        $authData = null;
        $maxAttempts = 3;
        $attempt = 0;

        while ($attempt < $maxAttempts && !$authData) {
            $attempt++;
            $authResp = $this->autorizacionClient
                ->autorizacionComprobante(['claveAccesoComprobante' => $accessKey]);

            $authData = $authResp
                ->RespuestaAutorizacionComprobante
                ->autorizaciones
                ->autorizacion
                ?? null;

            if (!$authData) {
                Log::warning("Intento {$attempt}: autorización aún no disponible para clave {$accessKey}");
                sleep(1); // Esperar antes de volver a intentar
            }
        }

        if (!$authData || !isset($authData->estado)) {
            $rejPath = $this->noAutorizadosDir . DIRECTORY_SEPARATOR . "{$accessKey}-NO-RESPONSE.xml";
            File::put($rejPath, $this->autorizacionClient->__getLastResponse());
            throw new Exception("SRI: No se recibió respuesta de autorización tras {$maxAttempts} intentos.");
        }

        $auth = $authData->estado;

        if ($auth !== 'AUTORIZADO') {
            if (! File::isDirectory($this->noAutorizadosDir)) {
                File::makeDirectory($this->noAutorizadosDir, 0755, true);
            }

            $rejPath = $this->noAutorizadosDir . DIRECTORY_SEPARATOR . "{$accessKey}-{$auth}.xml";
            File::put($rejPath, $this->autorizacionClient->__getLastResponse());

            $mensajes = $authData->mensajes->mensaje ?? null;
            $detalles = [];

            foreach ((array) $mensajes as $m) {
                $detalles[] = "[{$m->identificador}] {$m->mensaje}"
                    . (!empty($m->informacionAdicional) ? " ({$m->informacionAdicional})" : '');
            }

            $detalleTexto = $detalles ? implode('; ', $detalles) : 'Respuesta sin mensajes detallados.';
            throw new Exception("SRI Autorización: {$auth}. {$detalleTexto}");
        }

        // Guardar XML autorizado
        if (! File::isDirectory($this->autorizadosDir)) {
            File::makeDirectory($this->autorizadosDir, 0755, true);
        }

        $okPath = $this->autorizadosDir . DIRECTORY_SEPARATOR . "{$accessKey}.xml";
        File::put($okPath, $this->autorizacionClient->__getLastResponse());

        return [
            'path'     => $okPath,
            'response' => $authResp,
        ];
    }
}
