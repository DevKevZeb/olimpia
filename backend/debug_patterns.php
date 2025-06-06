<?php
require_once 'vendor/autoload.php';

use Smalot\PdfParser\Parser;

$pdfPath = __DIR__ . '/storage/app/public/temp_recibo_analysis.pdf';

try {
    $parser = new Parser();
    $pdf = $parser->parseFile($pdfPath);
    $ocrText = $pdf->getText();
    
    echo "=== ANÁLISIS DETALLADO DE LÍNEAS ESPECÍFICAS ===\n\n";
    
    $lines = explode("\n", $ocrText);
    foreach ($lines as $i => $line) {
        $line = trim($line);
        if (!empty($line)) {
            echo "Línea " . ($i + 1) . ": '$line'\n";
            
            // Verificar si contiene "Recibí de"
            if (preg_match('/Recib[íi]\s+de/i', $line)) {
                echo "  *** CONTIENE 'Recibí de' ***\n";
                // Extraer todo después de ":"
                if (preg_match('/Recib[íi]\s+de:\s*(.+)$/i', $line, $m)) {
                    echo "  Nombre extraído: '" . trim($m[1]) . "'\n";
                }
            }
            
            // Verificar si contiene "Aclaración"
            if (preg_match('/Aclaraci[óo]n/i', $line)) {
                echo "  *** CONTIENE 'Aclaración' ***\n";
                // Extraer todo después de ":"
                if (preg_match('/Aclaraci[óo]n:\s*(.+)$/i', $line, $m)) {
                    echo "  Aclaración extraída: '" . trim($m[1]) . "'\n";
                }
            }
        }
    }
    
    echo "\n=== PRUEBA DE PATRONES DIRECTOS ===\n";
    
    // Probar diferentes variantes del patrón de nombre
    $patrones_nombre = [
        '/Recibí de:\s*([^\n\r]+)/i',
        '/Recib[íi]\s+de:\s*([^\n\r]+)/i',
        '/Recib[íi]\s+de:\s*(.+?)(?=\n|$)/i',
        '/Recib[íi]\s+de:\s*(.+)/i'
    ];
    
    foreach ($patrones_nombre as $patron) {
        if (preg_match($patron, $ocrText, $m)) {
            echo "Patrón '$patron' funcionó: '" . trim($m[1]) . "'\n";
        } else {
            echo "Patrón '$patron' NO funcionó\n";
        }
    }
    
    // Probar diferentes variantes del patrón de aclaración
    $patrones_aclaracion = [
        '/Aclaración:\s*([^\n\r]+)/i',
        '/Aclaraci[óo]n:\s*([^\n\r]+)/i',
        '/Aclaraci[óo]n:\s*(.+?)(?=\n|$)/i',
        '/Aclaraci[óo]n:\s*(.+)/i'
    ];
    
    foreach ($patrones_aclaracion as $patron) {
        if (preg_match($patron, $ocrText, $m)) {
            echo "Patrón '$patron' funcionó: '" . trim($m[1]) . "'\n";
        } else {
            echo "Patrón '$patron' NO funcionó\n";
        }
    }
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
?>
