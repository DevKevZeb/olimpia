<?php

/**
 * Test de integración para OCR con archivo RECIBO real
 */

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;
use App\Models\OrdenPago;
use App\Models\ListaInscripcion;
use App\Models\EncargadoPago;
use Illuminate\Support\Facades\Storage;

class ReciboOCRRealTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test de extracción OCR con el archivo RECIBO.pdf real
     */
    public function test_ocr_extraction_with_real_recibo()
    {        // Crear modelos necesarios usando las factories
        $lista = ListaInscripcion::factory()->create();
        $encargado = EncargadoPago::factory()->create([
            'id_lista' => $lista->id_lista,
            'nombres' => 'Jafet',
            'apellidos' => 'Canaza',
        ]);

        // Crear orden con el código que está en el RECIBO real: O-SANSI-2025-84178
        $orden = OrdenPago::factory()->create([
            'codigo_unico' => 'O-SANSI-2025-84178',
            'monto_total' => 10.00, // Monto que está en el RECIBO real
            'estado' => 'pendiente',
            'id_lista' => $lista->id_lista,
        ]);

        // Usar el archivo RECIBO real
        $realPdfPath = base_path('tests/fixtures/RECIBO_CAJA_REAL.pdf');
        
        // Verificar que el archivo existe
        $this->assertFileExists($realPdfPath, 'El archivo RECIBO real no existe en tests/fixtures/');

        // Crear UploadedFile desde el archivo real
        $uploadedFile = new UploadedFile(
            $realPdfPath,
            'RECIBO_CAJA_REAL.pdf',
            'application/pdf',
            null,
            true // test mode
        );

        // Realizar la petición con el archivo real
        $response = $this->postJson('/api/v1/comprobantes-pago/por-codigo', [
            'pdf_comprobante' => $uploadedFile,
            'codigo_orden' => 'O-SANSI-2025-84178'
        ]);

        // Debug: Print response if there's an error
        if ($response->status() !== 201) {
            echo "\n=== DEBUG RESPUESTA ===\n";
            echo "Status: " . $response->status() . "\n";
            echo "Content: " . $response->content() . "\n";
            echo "=========================\n";
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

        // Verificar que los datos se extrajeron correctamente del RECIBO real
        $comprobante = $response->json('data');
        
        // Datos esperados basados en nuestro análisis del RECIBO real:
        // Número: 0000001
        // Nombre: Jafet Canaza  
        // Monto: 10.00
        // Código: O-SANSI-2025-84178
        
        $this->assertEquals('0000001', $comprobante['numero_comprobante']);
        $this->assertEquals('Jafet Canaza', $comprobante['nombre_pagador']);
        $this->assertEquals(10.00, $comprobante['monto_pagado']);
          // Verificar datos OCR almacenados
        $datosOCR = $comprobante['datos_ocr'];
        $this->assertEquals('0000001', $datosOCR['numero_recibo']);
        $this->assertEquals('03-06-25 11:30', $datosOCR['fecha']);
        $this->assertEquals('10.00', $datosOCR['monto_total']);
        $this->assertEquals('O-SANSI-2025-84178', $datosOCR['codigo_inscripcion_extraido']);
        $this->assertEquals('Jafet Canaza', $datosOCR['nombre_pagador']);
    }

    /**
     * Test de validación: código en RECIBO no coincide con orden
     */
    public function test_validation_codigo_no_coincide()
    {        // Crear modelos con código diferente al del RECIBO
        $lista = ListaInscripcion::factory()->create();
        $encargado = EncargadoPago::factory()->create([
            'id_lista' => $lista->id_lista,
            'nombres' => 'Jafet',
            'apellidos' => 'Canaza',
        ]);
        
        $orden = OrdenPago::factory()->create([
            'codigo_unico' => 'O-SANSI-2025-99999', // Código diferente al del RECIBO
            'monto_total' => 10.00,
            'estado' => 'pendiente',
            'id_lista' => $lista->id_lista,
        ]);

        $realPdfPath = base_path('tests/fixtures/RECIBO_CAJA_REAL.pdf');
        $uploadedFile = new UploadedFile($realPdfPath, 'RECIBO_CAJA_REAL.pdf', 'application/pdf', null, true);

        $response = $this->postJson('/api/v1/comprobantes-pago/por-codigo', [
            'pdf_comprobante' => $uploadedFile,
            'codigo_orden' => 'O-SANSI-2025-99999'
        ]);        // Debe devolver error 422 por código no coincidente
        $response->assertStatus(422)
                 ->assertJsonFragment([
                     'status' => 'Error'
                 ]);
    }

    /**
     * Test de validación: monto en RECIBO no coincide con orden
     */
    public function test_validation_monto_no_coincide()
    {        $lista = ListaInscripcion::factory()->create();
        $encargado = EncargadoPago::factory()->create([
            'id_lista' => $lista->id_lista,
            'nombres' => 'Jafet',
            'apellidos' => 'Canaza',
        ]);
        
        $orden = OrdenPago::factory()->create([
            'codigo_unico' => 'O-SANSI-2025-84178', // Código correcto
            'monto_total' => 50.00, // Monto diferente al del RECIBO (10.00)
            'estado' => 'pendiente',
            'id_lista' => $lista->id_lista,
        ]);

        $realPdfPath = base_path('tests/fixtures/RECIBO_CAJA_REAL.pdf');
        $uploadedFile = new UploadedFile($realPdfPath, 'RECIBO_CAJA_REAL.pdf', 'application/pdf', null, true);

        $response = $this->postJson('/api/v1/comprobantes-pago/por-codigo', [
            'pdf_comprobante' => $uploadedFile,
            'codigo_orden' => 'O-SANSI-2025-84178'
        ]);        // Debe devolver error 422 por monto no coincidente
        $response->assertStatus(422)
                 ->assertJsonFragment([
                     'status' => 'Error'
                 ]);
    }
}
