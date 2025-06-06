<?php
require_once 'vendor/autoload.php';

use Smalot\PdfParser\Parser;

// Analizar el RECIBO.pdf real  
$pdfPath = __DIR__ . '/storage/app/public/temp_recibo_analysis.pdf';

echo "=== ANÁLISIS DEL RECIBO REAL ===\n";
echo "Archivo: $pdfPath\n";
echo "Existe: " . (file_exists($pdfPath) ? "SÍ" : "NO") . "\n\n";

if (!file_exists($pdfPath)) {
    echo "ERROR: El archivo no existe en la ruta especificada.\n";
    exit(1);
}

try {
    $parser = new Parser();
    $pdf = $parser->parseFile($pdfPath);
    $text = $pdf->getText();
    
    echo "=== TEXTO EXTRAÍDO COMPLETO ===\n";
    echo $text . "\n";
    echo "=== FIN DEL TEXTO ===\n\n";
    
    echo "=== ANÁLISIS DE PATRONES ===\n";
    
    // Buscar posibles números
    if (preg_match_all('/\d+/', $text, $numbers)) {
        echo "Números encontrados: " . implode(', ', $numbers[0]) . "\n";
    }
    
    // Buscar fechas
    if (preg_match_all('/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/', $text, $dates)) {
        echo "Fechas encontradas: " . implode(', ', $dates[0]) . "\n";
    }
    
    // Buscar texto después de "Recibí de"
    if (preg_match('/Recib[íi]\s+de[:\s]+([^\n\r]+)/i', $text, $matches)) {
        echo "Recibí de: '" . trim($matches[1]) . "'\n";
    }
    
    // Buscar texto después de "Total"
    if (preg_match('/Total[:\s]+([^\n\r]+)/i', $text, $matches)) {
        echo "Total: '" . trim($matches[1]) . "'\n";
    }
    
    // Buscar texto después de "Aclaración"
    if (preg_match('/Aclaraci[óo]n[:\s]+([^\n\r]+)/i', $text, $matches)) {
        echo "Aclaración: '" . trim($matches[1]) . "'\n";
    }
    
    // Buscar texto después de "Nro"
    if (preg_match('/Nro\.?[:\s]+([^\n\r]+)/i', $text, $matches)) {
        echo "Nro.: '" . trim($matches[1]) . "'\n";
    }
    
    echo "\n=== LÍNEAS DEL TEXTO ===\n";
    $lines = explode("\n", $text);
    foreach ($lines as $i => $line) {
        $line = trim($line);
        if (!empty($line)) {
            echo "Línea " . ($i + 1) . ": '$line'\n";
        }
    }
    
} catch (Exception $e) {
    echo "ERROR al procesar PDF: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
?>
