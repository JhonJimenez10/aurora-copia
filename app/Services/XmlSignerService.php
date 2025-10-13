<?php

namespace App\Services;

use Exception;

class XmlSignerService
{
    /**
     * Firma el XML y devuelve la ruta absoluta al archivo firmado.
     *
     * @param  string $xmlPath   Ruta absoluta del XML a firmar
     * @param  string $idFactura UUID de la factura (para lookup de certificado)
     * @return string
     * @throws Exception
     */
    public function sign(string $xmlPath, string $idFactura): string
    {
        // ───────────────────────────────────────
        // 1) Datos de empresa / certificado
        // ───────────────────────────────────────
        $invoice    = \App\Models\Invoice::with('enterprise')->findOrFail($idFactura);
        $enterprise = $invoice->enterprise;

        if (!$enterprise || !$enterprise->signature || !$enterprise->signature_password) {
            throw new Exception('Certificado digital no configurado para la empresa.');
        }
        $certificatePath     = storage_path('app/private/' . $enterprise->signature);
        $certificatePassword = $enterprise->signature_password;

        // ───────────────────────────────────────
        // 2) Paths
        // ───────────────────────────────────────
        $rutaFirmador = base_path('app/Services/firmador.php');
        $signedDir = config('sri.dir_xml_firmados');


        if (!file_exists($xmlPath)) {
            throw new Exception("Archivo XML no encontrado: {$xmlPath}");
        }
        if (!is_dir($signedDir)) {
            mkdir($signedDir, 0755, true);
        }

        // ───────────────────────────────────────
        // 3) Ejecutar script de firma
        // ───────────────────────────────────────
        $php = '/usr/bin/php';
        $cmd = escapeshellarg($php) . ' ' .
            escapeshellarg($rutaFirmador) . ' ' .
            escapeshellarg($xmlPath) . ' ' .
            escapeshellarg($certificatePath) . ' ' .
            escapeshellarg($certificatePassword) . ' 2>&1';

        exec($cmd, $output, $status);

        if ($status !== 0) {
            throw new Exception("Error en firma (status={$status}):\n" . implode("\n", $output));
        }

        $archivoFirmado = $signedDir . DIRECTORY_SEPARATOR . basename($xmlPath);
        if (!file_exists($archivoFirmado)) {
            throw new Exception("Archivo firmado no encontrado: {$archivoFirmado}");
        }

        return $archivoFirmado;
    }
}
