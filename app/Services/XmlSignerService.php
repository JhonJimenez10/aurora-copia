<?php

namespace App\Services;

use Exception;

class XmlSignerService
{
    /**
     * @param string $xmlPath   Ruta absoluta al XML sin firmar
     * @param string $idFactura Identificador de factura (se pasa al CLI)
     * @return string           Ruta absoluta al XML firmado
     * @throws Exception
     */
    public function sign(string $xmlPath, string $idFactura): string
    {
        $invoice = \App\Models\Invoice::with('enterprise')->findOrFail($idFactura);
        $enterprise = $invoice->enterprise;

        if (!$enterprise || !$enterprise->signature || !$enterprise->signature_password) {
            throw new \Exception("Certificado digital no configurado para la empresa.");
        }

        // Ruta al certificado real en disco
        $certificatePath = storage_path('app/private/' . $enterprise->signature);
        $certificatePassword = $enterprise->signature_password;

        $rutaFirmador = base_path('app/Services/firmador.php');
        $signedDir = 'C:/facturas/facturas_firmados';

        if (!file_exists($xmlPath)) {
            throw new \Exception("Archivo XML no encontrado: {$xmlPath}");
        }

        if (!is_dir($signedDir)) {
            mkdir($signedDir, 0755, true);
        }

        // Comando CLI con los parámetros de certificado y contraseña
        $php = PHP_BINARY;
        $cmd = escapeshellarg($php) . ' ' .
            escapeshellarg($rutaFirmador) . ' ' .
            escapeshellarg($xmlPath) . ' ' .
            escapeshellarg($certificatePath) . ' ' .
            escapeshellarg($certificatePassword) . ' 2>&1';

        exec($cmd, $output, $status);

        if ($status !== 0) {
            throw new \Exception("Error en firma (status={$status}):\n" . implode("\n", $output));
        }

        $archivoFirmado = "{$signedDir}/" . basename($xmlPath);
        if (!file_exists($archivoFirmado)) {
            throw new \Exception("Archivo firmado no encontrado: {$archivoFirmado}");
        }

        return $archivoFirmado;
    }
}
