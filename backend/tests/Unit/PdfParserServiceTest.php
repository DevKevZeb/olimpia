<?php

namespace Tests\Unit;

use App\Exceptions\ComprobanteRechazadoException;
use App\Services\PdfParserService;
use Smalot\PdfParser\Parser;
use Tests\Support\ReceiptPdf;
use Tests\TestCase;

class PdfParserServiceTest extends TestCase
{
    private PdfParserService $parser;
    private array $tempFiles = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->parser = new PdfParserService(new Parser());
    }

    protected function tearDown(): void
    {
        array_map('unlink', $this->tempFiles);
        parent::tearDown();
    }

    private function receiptFile(array $overrides = []): string
    {
        $path = tempnam(sys_get_temp_dir(), 'recibo');
        file_put_contents($path, ReceiptPdf::make($overrides));
        $this->tempFiles[] = $path;

        return $path;
    }

    public function test_extracts_receipt_fields(): void
    {
        $data = $this->parser->extractDataFromReceiptPdf($this->receiptFile());

        $this->assertSame('0000123', $data['numero_recibo']);
        $this->assertSame('Ana Rojas', $data['nombre_pagador']);
        $this->assertSame(15.0, $data['monto_total']);
        $this->assertSame('O-SANSI-2025-00001', $data['codigo_inscripcion_extraido']);
    }

    public function test_reads_dates_as_day_month_year(): void
    {
        $corto = $this->parser->extractDataFromReceiptPdf($this->receiptFile(['fecha' => '03-06-25 11:30']));
        $largo = $this->parser->extractDataFromReceiptPdf($this->receiptFile(['fecha' => '03/06/2025']));

        $this->assertSame('2025-06-03', $corto['fecha_pago']);
        $this->assertSame('2025-06-03', $largo['fecha_pago']);
    }

    public function test_rejects_receipt_without_registration_code(): void
    {
        $this->expectException(ComprobanteRechazadoException::class);

        $this->parser->extractDataFromReceiptPdf($this->receiptFile(['aclaracion' => 'PAGO VARIOS']));
    }

    public function test_rejects_receipt_without_payer(): void
    {
        $this->expectException(ComprobanteRechazadoException::class);

        $this->parser->extractDataFromReceiptPdf($this->receiptFile(['pagador' => null]));
    }

    public function test_rejects_files_that_are_not_pdf(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'recibo');
        file_put_contents($path, 'esto no es un pdf');
        $this->tempFiles[] = $path;

        $this->expectException(ComprobanteRechazadoException::class);

        $this->parser->extractDataFromReceiptPdf($path);
    }

    public function test_normalizes_names_for_comparison(): void
    {
        $this->assertSame('JOSE NUNEZ PENA', $this->parser->normalizeName('  José  Núñez   Peña '));
    }
}
