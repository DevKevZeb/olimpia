<?php

namespace App\Services;

use Smalot\PdfParser\Parser;
use App\Exceptions\ComprobanteRechazadoException;
use Carbon\Carbon;

class PdfParserService
{
    protected $parser;

    public function __construct(Parser $parser)
    {
        $this->parser = $parser;
    }

    /**
     * Extrae datos específicos de un archivo PDF de recibo.
     *
     * @param string $filePath Ruta completa al archivo PDF en el sistema de archivos.
     * @return array Los datos extraídos (numero, fecha, nombre, monto, aclaracion, etc.)
     * @throws \Exception Si no se puede extraer algún dato esencial.
     */
    public function extractDataFromReceiptPdf(string $filePath): array
    {
        // Asegúrate de que el archivo exista antes de intentar parsearlo
        if (!file_exists($filePath)) {
            throw new \RuntimeException('El archivo PDF no se encontró en la ruta especificada: ' . $filePath);
        }

        try {
            $ocrText = $this->parser->parseFile($filePath)->getText();
        } catch (\Exception $e) {
            throw new ComprobanteRechazadoException('No se pudo leer el PDF del comprobante. Verifique que sea el recibo original.');
        }

        $data = [
            'ocr_text' => $ocrText,
            'numero_recibo' => null,
            'fecha_pago' => null, // Cambiado a 'fecha_pago' para ser más consistente
            'nombre_pagador' => null,
            'monto_total' => null,
            'aclaracion' => null,
            'codigo_inscripcion_extraido' => null,
        ];

        // Extraer Nro. del recibo
        if (preg_match('/Nro\.?\s*:?\s*([0-9]+)/i', $ocrText, $m)) {
            $data['numero_recibo'] = trim($m[1]);
        }

        // Extraer fecha (formato DD-MM-YY HH:MM) y convertir a formato YYYY-MM-DD
        if (preg_match('/Fecha:\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4}(?:\s+[0-9]{1,2}:[0-9]{2})?)/i', $ocrText, $m)) {
            $data['fecha_pago'] = $this->parseFecha(trim($m[1]));
        }

        // Extraer nombre del pagador "Recibí de:"
        if (preg_match('/Recibí de:\s*([^\n\r]+)/i', $ocrText, $m)) {
            $data['nombre_pagador'] = trim($m[1]);
        }

        // Extraer monto "Total:"
        if (preg_match('/Total[:\s]*.*?(\d+(?:[.,]\d{1,2})?)/i', $ocrText, $m)) {
            $data['monto_total'] = (float) str_replace(',', '.', trim($m[1]));
        }

        // Extraer aclaración completa
        if (preg_match('/Aclaración:\s*([^\n\r]+)/i', $ocrText, $m)) {
            $data['aclaracion'] = trim($m[1]);
            // Buscar código de inscripción en la aclaración (formato: O-SANSI-2025-XXXXX)
            if (preg_match('/(O-SANSI-\d{4}-\d+)/i', $data['aclaracion'], $cm)) {
                $data['codigo_inscripcion_extraido'] = trim($cm[1]);
            }
        }

        // Realizar validaciones de extracción aquí.
        // Si un dato crítico no se extrae, lanza una excepción específica.
        if (is_null($data['numero_recibo'])) {
            throw new ComprobanteRechazadoException('No se pudo extraer el número del recibo del PDF. Asegúrese de que el documento contenga el campo "Nro."');
        }
        if (is_null($data['fecha_pago'])) {
            throw new ComprobanteRechazadoException('No se pudo extraer la fecha del recibo del PDF. Asegúrese de que el documento contenga el campo "Fecha:".');
        }
        if (is_null($data['nombre_pagador'])) {
            throw new ComprobanteRechazadoException('No se pudo extraer el nombre del pagador del PDF. Asegúrese de que el documento contenga el campo "Recibí de:".');
        }
        if (is_null($data['monto_total'])) {
             // Debugging help:
            $linesContainingTotal = [];
            foreach (explode("\n", $ocrText) as $lineNum => $line) {
                if (preg_match('/total/i', trim($line))) {
                    $linesContainingTotal[] = "Línea " . ($lineNum + 1) . ": \"" . trim($line) . "\"";
                }
            }
            $debugInfo = empty($linesContainingTotal)
                ? "No se encontraron líneas que contengan 'Total'."
                : "Líneas con 'Total': " . implode("; ", $linesContainingTotal);
            throw new ComprobanteRechazadoException('No se pudo extraer el monto total del PDF. ' . $debugInfo);
        }
        if (is_null($data['aclaracion'])) {
            $linesContainingAclaracion = [];
            foreach (explode("\n", $ocrText) as $lineNum => $line) {
                if (preg_match('/aclaraci[óo]n/i', trim($line))) {
                    $linesContainingAclaracion[] = "Línea " . ($lineNum + 1) . ": \"" . trim($line) . "\"";
                }
            }
            $debugInfo = empty($linesContainingAclaracion)
                ? "No se encontraron líneas que contengan 'Aclaración'."
                : "Líneas con 'Aclaración': " . implode("; ", $linesContainingAclaracion);
            throw new ComprobanteRechazadoException('No se pudo extraer la aclaración del recibo. ' . $debugInfo);
        }
        if (is_null($data['codigo_inscripcion_extraido'])) {
            throw new ComprobanteRechazadoException('No se encontró un código de inscripción válido en la aclaración del PDF. El código debe tener el formato O-SANSI-YYYY-XXXXX');
        }

        return $data;
    }

    /**
     * Los recibos usan fechas día-mes-año (p. ej. 03-06-25 11:30); strtotime()
     * interpretaría 03-06-25 como año-mes-día.
     */
    private function parseFecha(string $fechaRaw): ?string
    {
        $fecha = preg_split('/\s+/', str_replace('/', '-', $fechaRaw))[0];
        $formato = preg_match('/-\d{4}$/', $fecha) ? 'd-m-Y' : 'd-m-y';

        try {
            return Carbon::createFromFormat('!' . $formato, $fecha)->format('Y-m-d');
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Normaliza nombres para comparación (mayúsculas, sin tildes, sin caracteres especiales).
     * Esta función se mueve aquí, ya que es parte del procesamiento de datos del PDF.
     *
     * @param string $str
     * @return string
     */
    public function normalizeName(string $str): string
    {
        $str = mb_strtoupper($str, 'UTF-8');
        $str = preg_replace('/[áàäâ]/iu', 'A', $str);
        $str = preg_replace('/[éèëê]/iu', 'E', $str);
        $str = preg_replace('/[íìïî]/iu', 'I', $str);
        $str = preg_replace('/[óòöô]/iu', 'O', $str);
        $str = preg_replace('/[úùüû]/iu', 'U', $str);
        $str = preg_replace('/ñ/iu', 'N', $str);
        $str = preg_replace('/[^A-Z ]/', '', $str); // Elimina caracteres que no sean letras mayúsculas o espacios
        $str = preg_replace('/\s+/', ' ', $str); // Reemplaza múltiples espacios por uno solo
        return trim($str);
    }
}