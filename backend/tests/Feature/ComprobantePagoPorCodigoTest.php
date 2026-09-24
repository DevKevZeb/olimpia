<?php

namespace Tests\Feature;

use App\Models\EncargadoPago;
use App\Models\ListaInscripcion;
use App\Models\OrdenPago;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\Support\ReceiptPdf;
use Tests\TestCase;

class ComprobantePagoPorCodigoTest extends TestCase
{
    use RefreshDatabase;

    private const CODIGO = 'OLP-2025-00001';

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    private function crearOrden(array $atributos = []): OrdenPago
    {
        $lista = ListaInscripcion::create(['fecha_creacion' => now()]);

        EncargadoPago::create([
            'nombres' => 'Ana María',
            'apellidos' => 'Rojas',
            'ci' => '7654321',
            'email' => 'ana@example.com',
            'id_lista' => $lista->id_lista,
        ]);

        return OrdenPago::create(array_merge([
            'codigo_unico' => self::CODIGO,
            'tipo_origen' => 'lista',
            'id_lista' => $lista->id_lista,
            'monto_total' => 15,
            'fecha_emision' => now(),
            'fecha_vencimiento' => now()->addDays(5),
            'estado' => 'pendiente',
        ], $atributos));
    }

    private function subirRecibo(array $datosRecibo = [], string $codigo = self::CODIGO)
    {
        $archivo = UploadedFile::fake()->createWithContent('recibo.pdf', ReceiptPdf::make($datosRecibo));

        return $this->postJson('/api/v1/comprobantes-pago/por-codigo', [
            'codigo_orden' => $codigo,
            'pdf_comprobante' => $archivo,
        ]);
    }

    public function test_valid_receipt_marks_the_order_as_paid(): void
    {
        $orden = $this->crearOrden();

        $this->subirRecibo(['pagador' => 'ROJAS ANA MARIA'])
            ->assertCreated()
            ->assertJsonPath('data.estado_verificacion', 'verificado')
            ->assertJsonPath('data.monto_pagado', '15.00');

        $this->assertSame('pagada', $orden->fresh()->estado);
        $this->assertCount(1, Storage::disk('public')->files('comprobantes'));
    }

    public function test_rejects_receipt_for_another_registration_code(): void
    {
        $orden = $this->crearOrden();

        $this->subirRecibo(['aclaracion' => 'OLP-2025-99999'])
            ->assertStatus(422)
            ->assertJsonPath('message', 'El recibo no pertenece al código de inscripción proporcionado.');

        $this->assertSame('pendiente', $orden->fresh()->estado);
        $this->assertEmpty(Storage::disk('public')->files('comprobantes'));
    }

    public function test_rejects_receipt_with_a_lower_amount(): void
    {
        $orden = $this->crearOrden();

        $this->subirRecibo(['total' => '10.00'])->assertStatus(422);

        $this->assertSame('pendiente', $orden->fresh()->estado);
    }

    public function test_rejects_receipt_paid_by_someone_else(): void
    {
        $this->crearOrden();

        $this->subirRecibo(['pagador' => 'Carlos Pérez'])
            ->assertStatus(422)
            ->assertJsonPath('message', 'El nombre del pagador en el recibo no coincide con el responsable de pago de la orden.');
    }

    public function test_rejects_receipt_for_an_order_already_paid(): void
    {
        $this->crearOrden(['estado' => 'pagada']);

        $this->subirRecibo()
            ->assertStatus(422)
            ->assertJsonPath('message', 'Esta orden de pago ya ha sido pagada.');
    }

    public function test_rejects_unknown_order_code(): void
    {
        $this->subirRecibo([], 'OLP-2025-00404')->assertStatus(422);
    }
}
