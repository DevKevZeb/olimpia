<?php
require_once 'vendor/autoload.php';

use Smalot\PdfParser\Parser;

// Test específico para validar OCR con el RECIBO real
$pdfPath = __DIR__ . '/storage/app/public/temp_recibo_analysis.pdf';

echo "=== TEST DE VALIDACIÓN OCR ACTUALIZADO ===\n\n";

try {
    $parser = new Parser();
    $pdf = $parser->parseFile($pdfPath);
    $ocrText = $pdf->getText();
    
    echo "Texto extraído:\n";
    echo "================\n";
    echo $ocrText . "\n";
    echo "================\n\n";
    
    // Variables para almacenar los datos extraídos
    $numero = null;
    $fecha = null;
    $nombre = null;
    $monto = null;
    $aclaracion = null;
    $codigoInscripcion = null;
    
    // Aplicar los patrones OCR actualizados
    
    // 1. Extraer Nro. del recibo
    if (preg_match('/Nro\.?\s*:?\s*([0-9]+)/i', $ocrText, $m)) {
        $numero = trim($m[1]);
        echo "✓ Número extraído: '$numero'\n";
    } else {
        echo "✗ NO se pudo extraer el número\n";
    }
    
    // 2. Extraer fecha (formato actualizado)
    if (preg_match('/Fecha:\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4}(?:\s+[0-9]{1,2}:[0-9]{2})?)/i', $ocrText, $m)) {
        $fecha = trim($m[1]);
        echo "✓ Fecha extraída: '$fecha'\n";
    } else {
        echo "✗ NO se pudo extraer la fecha\n";
    }    // 3. Extraer nombre del pagador "Recibí de:" - patrón exacto
    if (preg_match('/Recibí de:\s*([^\n\r]+)/i', $ocrText, $m)) {
        $nombre = trim($m[1]);
        echo "✓ Nombre extraído: '$nombre'\n";
    } else {
        echo "✗ NO se pudo extraer el nombre\n";
    }
    
    // 4. Extraer monto "Total: Bs" (patrón actualizado)
    if (preg_match('/Total:\s*(?:Bs\s*)?(\d+(?:[.,]\d{2})?)/i', $ocrText, $m)) {
        $monto = str_replace(',', '.', trim($m[1]));
        echo "✓ Monto extraído: '$monto'\n";
    } else {
        echo "✗ NO se pudo extraer el monto\n";
    }    // 5. Extraer aclaración completa - patrón exacto
    if (preg_match('/Aclaración:\s*([^\n\r]+)/i', $ocrText, $m)) {
        $aclaracion = trim($m[1]);
        echo "✓ Aclaración extraída: '$aclaracion'\n";
        
        // Buscar código de inscripción en la aclaración
        if (preg_match('/(O-SANSI-\d{4}-\d+)/i', $aclaracion, $cm)) {
            $codigoInscripcion = trim($cm[1]);
            echo "✓ Código de inscripción extraído: '$codigoInscripcion'\n";
        } else {
            echo "✗ NO se pudo extraer código de inscripción de la aclaración\n";
        }
    } else {
        echo "✗ NO se pudo extraer la aclaración\n";
    }
    
    echo "\n=== RESUMEN DE EXTRACCIÓN ===\n";
    echo "Número: " . ($numero ?? 'NO EXTRAÍDO') . "\n";
    echo "Fecha: " . ($fecha ?? 'NO EXTRAÍDO') . "\n";
    echo "Nombre: " . ($nombre ?? 'NO EXTRAÍDO') . "\n";
    echo "Monto: " . ($monto ?? 'NO EXTRAÍDO') . "\n";
    echo "Aclaración: " . ($aclaracion ?? 'NO EXTRAÍDO') . "\n";
    echo "Código Inscripción: " . ($codigoInscripcion ?? 'NO EXTRAÍDO') . "\n";
    
    // Validación de datos críticos
    echo "\n=== VALIDACIÓN ===\n";
    $errores = [];
    
    if (!$numero) {
        $errores[] = "Número de recibo requerido para identificación";
    }
    
    if (!$fecha) {
        $errores[] = "Fecha requerida para validación temporal";
    }
    
    if (!$nombre) {
        $errores[] = "Nombre del pagador requerido";
    }
    
    if (!$monto) {
        $errores[] = "Monto requerido para validación de pago";
    }
    
    if (!$codigoInscripcion) {
        $errores[] = "Código de inscripción requerido para asociar el pago";
    }
    
    if (empty($errores)) {
        echo "✓ TODOS LOS DATOS CRÍTICOS EXTRAÍDOS CORRECTAMENTE\n";
        
        // Validar formato del código
        if (preg_match('/^O-SANSI-\d{4}-\d+$/', $codigoInscripcion)) {
            echo "✓ Formato del código de inscripción válido\n";
        } else {
            echo "✗ Formato del código de inscripción inválido\n";
        }
        
        // Validar monto numérico
        if (is_numeric($monto) && $monto > 0) {
            echo "✓ Monto válido: $monto Bs\n";
        } else {
            echo "✗ Monto inválido: $monto\n";
        }
        
    } else {
        echo "✗ ERRORES ENCONTRADOS:\n";
        foreach ($errores as $error) {
            echo "  - $error\n";
        }
    }
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
?>
