<?php

namespace Tests\Support;

/**
 * Genera recibos de caja ficticios en PDF para los tests, con el mismo
 * formato de texto que los recibos reales que lee PdfParserService.
 */
class ReceiptPdf
{
    public static function make(array $overrides = []): string
    {
        $data = array_merge([
            'numero' => '0000123',
            'pagador' => 'Ana Rojas',
            'fecha' => '03-06-25 11:30',
            'total' => '15.00',
            'aclaracion' => 'O-SANSI-2025-00001',
        ], $overrides);

        $lines = array_filter([
            'RECIBO DE CAJA (EJEMPLO)',
            'Nro. ' . $data['numero'],
            $data['pagador'] !== null ? 'Recibí de: ' . $data['pagador'] : null,
            'Por concepto de: OLIMPIADA OH! SANSI',
            'Fecha: ' . $data['fecha'],
            'Total: Bs ' . $data['total'],
            $data['aclaracion'] !== null ? 'Aclaración: ' . $data['aclaracion'] : null,
        ]);

        return self::build($lines);
    }

    /**
     * PDF 1.4 de una página con una línea de texto por elemento.
     */
    private static function build(array $lines): string
    {
        $text = '';
        foreach ($lines as $line) {
            $encoded = mb_convert_encoding($line, 'Windows-1252', 'UTF-8');
            $text .= '(' . addcslashes($encoded, '()\\') . ") Tj T*\n";
        }
        $stream = "BT /F1 12 Tf 16 TL 50 780 Td\n{$text}ET";

        $objects = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
            '<< /Length ' . strlen($stream) . " >>\nstream\n{$stream}\nendstream",
        ];

        $pdf = "%PDF-1.4\n";
        $offsets = [];
        foreach ($objects as $i => $object) {
            $offsets[] = strlen($pdf);
            $pdf .= ($i + 1) . " 0 obj\n{$object}\nendobj\n";
        }

        $xref = strlen($pdf);
        $pdf .= 'xref' . "\n0 " . (count($objects) + 1) . "\n0000000000 65535 f \n";
        foreach ($offsets as $offset) {
            $pdf .= sprintf("%010d 00000 n \n", $offset);
        }
        $pdf .= 'trailer << /Size ' . (count($objects) + 1) . " /Root 1 0 R >>\nstartxref\n{$xref}\n%%EOF";

        return $pdf;
    }
}
