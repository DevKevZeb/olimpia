<?php
require_once 'vendor/autoload.php';

use Smalot\PdfParser\Parser;

echo "=== TEST DEL PATRÓN MEJORADO ===\n\n";

// Usar el patrón mejorado
$patronMejorado = '/Total[:\s]*.*?(\d+(?:[.,]\d{1,2})?)/i';

// Test con el archivo real
$pdfPath = __DIR__ . '/storage/app/public/temp_recibo_analysis.pdf';

if (file_exists($pdfPath)) {
    try {
        $parser = new Parser();
        $pdf = $parser->parseFile($pdfPath);
        $ocrText = $pdf->getText();
        
        echo "=== EXTRACCIÓN CON PATRÓN MEJORADO ===\n";
        
        // Variables para almacenar los datos extraídos
        $numero = null;
        $fecha = null;
        $nombre = null;
        $monto = null;
        $aclaracion = null;
        $codigoInscripcion = null;
        
        // 1. Extraer Nro. del recibo
        if (preg_match('/Nro\.?\s*:?\s*([0-9]+)/i', $ocrText, $m)) {
            $numero = trim($m[1]);
            echo "✓ Número extraído: '$numero'\n";
        } else {
            echo "✗ NO se pudo extraer el número\n";
        }
        
        // 2. Extraer fecha
        if (preg_match('/Fecha:\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4}(?:\s+[0-9]{1,2}:[0-9]{2})?)/i', $ocrText, $m)) {
            $fecha = trim($m[1]);
            echo "✓ Fecha extraída: '$fecha'\n";
        } else {
            echo "✗ NO se pudo extraer la fecha\n";
        }
        
        // 3. Extraer nombre
        if (preg_match('/Recibí de:\s*([^\n\r]+)/i', $ocrText, $m)) {
            $nombre = trim($m[1]);
            echo "✓ Nombre extraído: '$nombre'\n";
        } else {
            echo "✗ NO se pudo extraer el nombre\n";
        }
        
        // 4. Extraer monto con patrón mejorado
        if (preg_match($patronMejorado, $ocrText, $m)) {
            $monto = str_replace(',', '.', trim($m[1]));
            echo "✓ Monto extraído con patrón mejorado: '$monto'\n";
        } else {
            echo "✗ NO se pudo extraer el monto con patrón mejorado\n";
        }
        
        // 5. Extraer aclaración
        if (preg_match('/Aclaración:\s*([^\n\r]+)/i', $ocrText, $m)) {
            $aclaracion = trim($m[1]);
            echo "✓ Aclaración extraída: '$aclaracion'\n";
            
            // Buscar código de inscripción
            if (preg_match('/(O-SANSI-\d{4}-\d+)/i', $aclaracion, $cm)) {
                $codigoInscripcion = trim($cm[1]);
                echo "✓ Código de inscripción extraído: '$codigoInscripcion'\n";
            } else {
                echo "✗ NO se pudo extraer código de inscripción\n";
            }
        } else {
            echo "✗ NO se pudo extraer la aclaración\n";
        }
        
        echo "\n=== RESUMEN FINAL ===\n";
        echo "Número: " . ($numero ?? 'NO EXTRAÍDO') . "\n";
        echo "Fecha: " . ($fecha ?? 'NO EXTRAÍDO') . "\n";
        echo "Nombre: " . ($nombre ?? 'NO EXTRAÍDO') . "\n";
        echo "Monto: " . ($monto ?? 'NO EXTRAÍDO') . "\n";
        echo "Aclaración: " . ($aclaracion ?? 'NO EXTRAÍDO') . "\n";
        echo "Código: " . ($codigoInscripcion ?? 'NO EXTRAÍDO') . "\n";
        
        if ($numero && $fecha && $nombre && $monto && $codigoInscripcion) {
            echo "\n✅ TODOS LOS CAMPOS CRÍTICOS EXTRAÍDOS CORRECTAMENTE\n";
        } else {
            echo "\n❌ FALTAN CAMPOS CRÍTICOS\n";
        }
        
    } catch (Exception $e) {
        echo "ERROR: " . $e->getMessage() . "\n";
    }
} else {
    echo "Archivo PDF no encontrado: $pdfPath\n";
}
?>
