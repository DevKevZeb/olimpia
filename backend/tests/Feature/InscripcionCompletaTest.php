<?php

namespace Tests\Feature;

use App\Models\AreaCompetencia;
use App\Models\Convocatoria;
use App\Models\ConvocatoriaArea;
use App\Models\ConvocatoriaNivel;
use App\Models\Grado;
use App\Models\NivelCategoria;
use App\Models\OrdenPago;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class InscripcionCompletaTest extends TestCase
{
    use RefreshDatabase;

    private Convocatoria $convocatoria;
    private ConvocatoriaNivel $nivelPrimaria;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();

        $primero = Grado::create(['nombre_grado' => '1ro Primaria', 'orden' => 1]);
        $segundo = Grado::create(['nombre_grado' => '2do Primaria', 'orden' => 2]);
        Grado::create(['nombre_grado' => '1ro Secundaria', 'orden' => 7]);

        $this->convocatoria = Convocatoria::create([
            'nombre' => 'Olimpiada de prueba',
            'fecha_inicio_inscripcion' => now()->subDay(),
            'fecha_fin_inscripcion' => now()->addMonth(),
            'max_areas_por_estudiante' => 2,
            'estado' => 'abierta',
        ]);

        $area = ConvocatoriaArea::create([
            'id_convocatoria' => $this->convocatoria->id_convocatoria,
            'id_area' => AreaCompetencia::create(['nombre_area' => 'Matemáticas'])->id_area,
            'costo_inscripcion' => 15,
        ]);

        $this->nivelPrimaria = ConvocatoriaNivel::create([
            'id_convocatoria_area' => $area->id_convocatoria_area,
            'id_nivel' => NivelCategoria::create(['nombre_nivel' => 'Básico Primaria'])->id_nivel,
            'id_grado_min' => $primero->id_grado,
            'id_grado_max' => $segundo->id_grado,
        ]);
    }

    private function payload(string $nombreGrado, ?int $idConvocatoriaNivel = null): array
    {
        return [
            'id_convocatoria' => $this->convocatoria->id_convocatoria,
            'codigo_unico' => 'OLP-2026-00001',
            'encargado_pago' => [
                'nombres_encargado' => 'Ana',
                'apellidos_encargado' => 'Rojas',
                'ci_encargado' => '7654321',
                'email_encargado' => 'ana@example.com',
            ],
            'lista_inscripcion' => [[
                'nombres' => 'Luis',
                'apellidos' => 'Pérez',
                'ci' => '1234567',
                'fecha_nacimiento' => '2018-04-10',
                'id_grado' => Grado::where('nombre_grado', $nombreGrado)->value('id_grado'),
                'unidad_educativa' => ['nombre' => 'U.E. Demo', 'departamento' => 'Cochabamba', 'provincia' => 'Cercado'],
                'tutor_legal' => [
                    'nombres' => 'Ana',
                    'apellidos' => 'Rojas',
                    'ci' => '7654321',
                    'es_el_mismo_estudiante' => false,
                ],
                'areas_seleccionadas' => [
                    ['id_convocatoria_nivel' => $idConvocatoriaNivel ?? $this->nivelPrimaria->id_convocatoria_nivel],
                ],
            ]],
        ];
    }

    public function test_registers_student_and_creates_payment_order(): void
    {
        $this->postJson('/api/v1/public/inscripcion-completa', $this->payload('2do Primaria'))
            ->assertCreated();

        $orden = OrdenPago::where('codigo_unico', 'OLP-2026-00001')->firstOrFail();
        $this->assertSame('pendiente', $orden->estado);
        $this->assertEquals(15, $orden->monto_total);
    }

    public function test_rejects_level_that_does_not_admit_the_student_grade(): void
    {
        $this->postJson('/api/v1/public/inscripcion-completa', $this->payload('1ro Secundaria'))
            ->assertStatus(422)
            ->assertJsonPath('message', 'El grado 1ro Secundaria no corresponde al nivel seleccionado.');

        $this->assertSame(0, OrdenPago::count());
    }

    public function test_rejects_level_from_another_convocatoria(): void
    {
        $otra = Convocatoria::create([
            'nombre' => 'Otra convocatoria',
            'fecha_inicio_inscripcion' => now(),
            'fecha_fin_inscripcion' => now()->addMonth(),
            'max_areas_por_estudiante' => 1,
            'estado' => 'planificada',
        ]);
        $areaAjena = ConvocatoriaArea::create([
            'id_convocatoria' => $otra->id_convocatoria,
            'id_area' => AreaCompetencia::create(['nombre_area' => 'Física'])->id_area,
            'costo_inscripcion' => 10,
        ]);
        $nivelAjeno = ConvocatoriaNivel::create([
            'id_convocatoria_area' => $areaAjena->id_convocatoria_area,
            'id_nivel' => $this->nivelPrimaria->id_nivel,
            'id_grado_min' => $this->nivelPrimaria->id_grado_min,
            'id_grado_max' => $this->nivelPrimaria->id_grado_max,
        ]);

        $this->postJson('/api/v1/public/inscripcion-completa', $this->payload('1ro Primaria', $nivelAjeno->id_convocatoria_nivel))
            ->assertStatus(422)
            ->assertJsonPath('message', 'El nivel seleccionado no pertenece a esta convocatoria.');
    }
}
