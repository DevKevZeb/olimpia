<?php
require_once 'vendor/autoload.php';

use Smalot\PdfParser\Parser;

echo "=== DEBUG DEL PATRÓN 'TOTAL' ===\n\n";

// Simulamos diferentes formatos de "Total" que podrían aparecer en el PDF
$testTexts = [
    // Formato del RECIBO original
    "Total: Bs                       10.00",
    
    // Otros posibles formatos
    "Total: 15.50",
    "Total:20.00",
    "Total: Bs 25.75",
    "Total:     Bs     30.00",
    "Total: Bs.              45.25",
    "Total Bs 50.00",
    "Total:   100,50",
    "Total: $ 75.00",
    "TOTAL: 85.00",
    "Total: BS 95.00",
    
    // Con texto completo simulado
    "Recibido de: Juan Pérez\nTotal: Bs                   125.50\nAclaración: O-SANSI-2025-12345"
];

// Patrones a probar
$patrones = [
    // Patrón actual
    '/Total:\s*(?:Bs\s*)?(\d+(?:[.,]\d{2})?)/i',
    
    // Patrones mejorados
    '/Total[:\s]*(?:Bs?\.?\s*)?(\d+(?:[.,]\d{1,2})?)/i',
    '/Total[:\s]*(?:Bs?\.?\s*)?[^\d]*(\d+(?:[.,]\d{1,2})?)/i',
    '/Total[:\s]*.*?(\d+(?:[.,]\d{1,2})?)/i',
    '/Total[:\s]+[^0-9]*(\d+(?:[.,]\d{1,2})?)/i'
];

echo "Probando diferentes textos y patrones:\n";
echo "=====================================\n\n";

foreach ($testTexts as $i => $texto) {
    echo "TEXTO " . ($i + 1) . ": \"$texto\"\n";
    echo str_repeat("-", 50) . "\n";
    
    foreach ($patrones as $j => $patron) {
        echo "Patrón " . ($j + 1) . ": $patron\n";
        
        if (preg_match($patron, $texto, $matches)) {
            $monto = str_replace(',', '.', trim($matches[1]));
            echo "  ✓ COINCIDE: '$monto'\n";
        } else {
            echo "  ✗ NO COINCIDE\n";
        }
    }
    echo "\n";
}

echo "\n=== ANÁLISIS CON ARCHIVO REAL ===\n";

// Si existe el archivo real, también lo probamos
$pdfPath = __DIR__ . '/storage/app/public/temp_recibo_analysis.pdf';
if (file_exists($pdfPath)) {
    try {
        $parser = new Parser();
        $pdf = $parser->parseFile($pdfPath);
        $ocrText = $pdf->getText();
        
        echo "Líneas del archivo real que contienen 'Total':\n";
        echo "---------------------------------------------\n";
        
        $lines = explode("\n", $ocrText);
        foreach ($lines as $lineNum => $line) {
            if (preg_match('/total/i', $line)) {
                $line = trim($line);
                echo "Línea " . ($lineNum + 1) . ": \"$line\"\n";
                
                // Probar cada patrón en esta línea
                foreach ($patrones as $j => $patron) {
                    if (preg_match($patron, $line, $matches)) {
                        $monto = str_replace(',', '.', trim($matches[1]));
                        echo "  Patrón " . ($j + 1) . " ✓: '$monto'\n";
                    }
                }
                echo "\n";
            }
        }
        
    } catch (Exception $e) {
        echo "Error al procesar PDF: " . $e->getMessage() . "\n";
    }
} else {
    echo "Archivo PDF no encontrado en: $pdfPath\n";
}

echo "\n=== RECOMENDACIÓN ===\n";
echo "El patrón más robusto parece ser:\n";
echo "/Total[:\s]*.*?(\d+(?:[.,]\d{1,2})?)/i\n";
echo "Este patrón:\n";
echo "- Busca 'Total' seguido de ':' o espacios\n";
echo "- Permite cualquier texto hasta encontrar números\n";
echo "- Captura números con 1-2 decimales\n";
echo "- Es case-insensitive\n";
?>
