<?php

/**
 * Test unitario para validar la funcionalidad OCR actualizada
 * Archivo: tests/Feature/ComprobanteOCRTest.php
 */

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;
use App\Models\OrdenPago;
use Illuminate\Support\Facades\Storage;

class ComprobanteOCRTest extends TestCase
{
    use RefreshDatabase;    /**
     * Test de extracción OCR exitosa con nuevo formato de recibo
     */
    public function test_ocr_extraction_success_new_format()
    {
        // Crear lista de inscripción y encargado de pago
        $lista = \App\Models\ListaInscripcion::factory()->create();
        $encargado = \App\Models\EncargadoPago::factory()->create([
            'id_lista' => $lista->id_lista,
            'nombres' => 'JUAN CARLOS',
            'apellidos' => 'PÉREZ MAMANI',
        ]);

        // Crear una orden de pago de prueba
        $orden = OrdenPago::factory()->create([
            'codigo_unico' => 'O-SANSI-2024-12345',
            'monto_total' => 150.00,
            'estado' => 'pendiente',
            'id_lista' => $lista->id_lista,
        ]);

        // Simular texto OCR de recibo de caja válido
        $mockOCRText = "
        RECIBO DE CAJA
        
        Nro.: 001234
        Fecha: 15/06/2024
        
        Recibí de: JUAN CARLOS PÉREZ MAMANI
        
        La cantidad de: CIENTO CINCUENTA 00/100 BOLIVIANOS
        
        Total: 150.00
        
        Por concepto de: Pago de inscripción
        
        Aclaración: Inscripción curso de capacitación O-SANSI-2024-12345
        
        Cajero: María González
        ";

        // Crear archivo PDF simulado
        Storage::fake('public');
        $file = UploadedFile::fake()->create('recibo.pdf', 1024, 'application/pdf');

        // Mock del parser PDF para retornar nuestro texto de prueba
        $this->mockPDFParser($mockOCRText);        // Realizar la petición
        $response = $this->postJson('/api/v1/comprobantes-pago/por-codigo', [
            'pdf_comprobante' => $file,
            'codigo_orden' => 'O-SANSI-2024-12345'
        ]);

        // Debug: Print response if there's an error
        if ($response->status() !== 201) {
            dump('Response status: ' . $response->status());
            dump('Response content: ' . $response->content());
        }

        // Verificar respuesta exitosa
        $response->assertStatus(201)
                ->assertJsonStructure([
                    'success',
                    'message',
                    'data' => [
                        'id_orden',
                        'numero_comprobante',
                        'nombre_pagador',
                        'monto_pagado',
                        'datos_ocr'
                    ]
                ]);

        // Verificar que los datos se extrajeron correctamente
        $comprobante = $response->json('data');
        
        $this->assertEquals('001234', $comprobante['numero_comprobante']);
        $this->assertEquals('JUAN CARLOS PÉREZ MAMANI', $comprobante['nombre_pagador']);
        $this->assertEquals(150.00, $comprobante['monto_pagado']);
        
        // Verificar datos OCR almacenados
        $datosOCR = $comprobante['datos_ocr'];
        $this->assertEquals('001234', $datosOCR['numero_recibo']);
        $this->assertEquals('15/06/2024', $datosOCR['fecha']);
        $this->assertEquals('150.00', $datosOCR['monto_total']);
        $this->assertEquals('O-SANSI-2024-12345', $datosOCR['codigo_inscripcion_extraido']);
        $this->assertStringContainsString('Inscripción curso', $datosOCR['aclaracion']);

        // Verificar que la orden se marcó como pagada
        $orden->refresh();
        $this->assertEquals('pagada', $orden->estado);
    }    /**
     * Test de validación: código de inscripción no coincide
     */
    public function test_ocr_validation_codigo_no_coincide()
    {
        // Crear lista de inscripción y encargado de pago
        $lista = \App\Models\ListaInscripcion::factory()->create();
        $encargado = \App\Models\EncargadoPago::factory()->create([
            'id_lista' => $lista->id_lista,
        ]);

        $orden = OrdenPago::factory()->create([
            'codigo_unico' => 'O-SANSI-2024-12345',
            'monto_total' => 150.00,
            'estado' => 'pendiente',
            'id_lista' => $lista->id_lista,
        ]);

        $mockOCRText = "
        Nro.: 001234
        Fecha: 15/06/2024
        Recibí de: JUAN PÉREZ
        Total: 150.00
        Aclaración: Pago inscripción O-SANSI-2024-99999
        ";

        Storage::fake('public');
        $file = UploadedFile::fake()->create('recibo.pdf', 1024, 'application/pdf');
        $this->mockPDFParser($mockOCRText);

        $response = $this->postJson('/api/v1/comprobantes-pago/por-codigo', [
            'pdf_comprobante' => $file,
            'codigo_orden' => 'O-SANSI-2024-12345'
        ]);

        $response->assertStatus(422)
                ->assertJsonFragment([
                    'message' => 'El código de inscripción en la aclaración del recibo no coincide con el código de la orden de pago.'
                ]);
    }    /**
     * Test de validación: monto no coincide
     */
    public function test_ocr_validation_monto_no_coincide()
    {
        // Crear lista de inscripción y encargado de pago
        $lista = \App\Models\ListaInscripcion::factory()->create();
        $encargado = \App\Models\EncargadoPago::factory()->create([
            'id_lista' => $lista->id_lista,
        ]);

        $orden = OrdenPago::factory()->create([
            'codigo_unico' => 'O-SANSI-2024-12345',
            'monto_total' => 150.00,
            'estado' => 'pendiente',
            'id_lista' => $lista->id_lista,
        ]);

        $mockOCRText = "
        Nro.: 001234
        Fecha: 15/06/2024
        Recibí de: JUAN PÉREZ
        Total: 200.00
        Aclaración: Pago inscripción O-SANSI-2024-12345
        ";

        Storage::fake('public');
        $file = UploadedFile::fake()->create('recibo.pdf', 1024, 'application/pdf');
        $this->mockPDFParser($mockOCRText);

        $response = $this->postJson('/api/v1/comprobantes-pago/por-codigo', [
            'pdf_comprobante' => $file,
            'codigo_orden' => 'O-SANSI-2024-12345'
        ]);

        $response->assertStatus(422)
                ->assertJsonFragment([
                    'message' => 'El monto del recibo (Bs. 200.00) no coincide con el monto de la orden de pago (Bs. 150.00).'
                ]);
    }    /**
     * Test de validación: campo faltante
     */
    public function test_ocr_validation_campo_faltante()
    {
        // Crear lista de inscripción y encargado de pago
        $lista = \App\Models\ListaInscripcion::factory()->create();
        $encargado = \App\Models\EncargadoPago::factory()->create([
            'id_lista' => $lista->id_lista,
        ]);

        $orden = OrdenPago::factory()->create([
            'codigo_unico' => 'O-SANSI-2024-12345',
            'monto_total' => 150.00,
            'estado' => 'pendiente',
            'id_lista' => $lista->id_lista,
        ]);

        // Recibo sin campo "Total"
        $mockOCRText = "
        Nro.: 001234
        Fecha: 15/06/2024
        Recibí de: JUAN PÉREZ
        Aclaración: Pago inscripción O-SANSI-2024-12345
        ";

        Storage::fake('public');
        $file = UploadedFile::fake()->create('recibo.pdf', 1024, 'application/pdf');
        $this->mockPDFParser($mockOCRText);

        $response = $this->postJson('/api/v1/comprobantes-pago/por-codigo', [
            'pdf_comprobante' => $file,
            'codigo_orden' => 'O-SANSI-2024-12345'
        ]);

        $response->assertStatus(422)
                ->assertJsonFragment([
                    'message' => 'No se pudo extraer el monto total. Asegúrese de que el documento contenga el campo "Total:"'
                ]);
    }    /**
     * Test de validación: código no encontrado en aclaración
     */
    public function test_ocr_validation_codigo_no_encontrado()
    {
        // Crear lista de inscripción y encargado de pago
        $lista = \App\Models\ListaInscripcion::factory()->create();
        $encargado = \App\Models\EncargadoPago::factory()->create([
            'id_lista' => $lista->id_lista,
        ]);

        $orden = OrdenPago::factory()->create([
            'codigo_unico' => 'O-SANSI-2024-12345',
            'monto_total' => 150.00,
            'estado' => 'pendiente',
            'id_lista' => $lista->id_lista,
        ]);

        $mockOCRText = "
        Nro.: 001234
        Fecha: 15/06/2024
        Recibí de: JUAN PÉREZ
        Total: 150.00
        Aclaración: Pago de inscripción sin código
        ";

        Storage::fake('public');
        $file = UploadedFile::fake()->create('recibo.pdf', 1024, 'application/pdf');
        $this->mockPDFParser($mockOCRText);

        $response = $this->postJson('/api/v1/comprobantes-pago/por-codigo', [
            'pdf_comprobante' => $file,
            'codigo_orden' => 'O-SANSI-2024-12345'
        ]);

        $response->assertStatus(422)
                ->assertJsonFragment([
                    'message' => 'No se encontró un código de inscripción válido en la aclaración. El código debe tener el formato O-SANSI-YYYY-XXXXX'
                ]);
    }

    /**
     * Helper para mockear el parser PDF
     */
    private function mockPDFParser($texto)
    {
        // Aquí se puede implementar el mock del parser PDF
        // Por ahora es un placeholder para la funcionalidad
        $this->app->bind(\Smalot\PdfParser\Parser::class, function () use ($texto) {
            $mock = \Mockery::mock(\Smalot\PdfParser\Parser::class);
            $pdfMock = \Mockery::mock();
            $pdfMock->shouldReceive('getText')->andReturn($texto);
            $mock->shouldReceive('parseFile')->andReturn($pdfMock);
            return $mock;
        });
    }

    protected function tearDown(): void
    {
        \Mockery::close();
        parent::tearDown();
    }
}
