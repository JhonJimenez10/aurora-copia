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
        // 1) Ruta al script CLI que acabamos de corregir
        $rutaFirmador = base_path('app/Services/firmador.php');
        $signedDir    = base_path('app/Services/facturas_firmados');

        if (! file_exists($xmlPath)) {
            throw new Exception("Archivo XML no encontrado: {$xmlPath}");
        }

        // Aseguro que exista la carpeta donde firmamos
        if (! is_dir($signedDir) && ! mkdir($signedDir, 0755, true)) {
            throw new Exception("No se pudo crear directorio de firmados: {$signedDir}");
        }

        // 2) Construyo el comando usando el mismo binario de PHP
        $php = PHP_BINARY;
        $cmd = escapeshellarg($php)
            . ' ' . escapeshellarg($rutaFirmador)
            . ' ' . escapeshellarg($xmlPath)
            . ' ' . escapeshellarg($idFactura)
            . ' 2>&1';

        exec($cmd, $output, $status);

        // 3) Compruebo error de ejecución
        if ($status !== 0) {
            throw new Exception(
                "El firmador devolvió status={$status}:\n" .
                    implode("\n", $output)
            );
        }

        // 4) Ruta al XML firmado
        $archivoFirmado = "{$signedDir}/" . basename($xmlPath);
        if (! file_exists($archivoFirmado)) {
            throw new Exception(
                "No se encontró el archivo firmado en: {$archivoFirmado}\n" .
                    "Salida del firmador:\n" . implode("\n", $output)
            );
        }

        return $archivoFirmado;
    }
}
