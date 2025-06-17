<?php
namespace App\Services;

use App\Models\Convocatoria;
use App\Models\ConvocatoriaNivel;
use App\Models\DetalleListaInscripcion;
use App\Models\EncargadoPago;
use App\Models\Estudiante;
use App\Models\ListaInscripcion;
use App\Models\OrdenPago;
use App\Models\TutorAcademico;
use App\Models\TutorLegal;
use App\Models\UnidadEducativa;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str; // Para generar códigos si se necesita

class InscripcionService
{
    protected $inscripcionCheckerService; // Para reutilizar la lógica de verificación

    public function __construct(InscripcionCheckerService $inscripcionCheckerService)
    {
        $this->inscripcionCheckerService = $inscripcionCheckerService;
    }

    public function processInscripcion(array $data, Convocatoria $convocatoria): array
    {
        // Realizar las verificaciones previas aquí o asumirlas hechas por el controlador
        $erroresPrevia = $this->inscripcionCheckerService->checkStudentsForInscripcion($data['lista_inscripcion'], $convocatoria);
        if (!empty($erroresPrevia)) {
            // Esto debería ser manejado por el controlador llamante.
            // Para simplificar, aquí podemos lanzar una excepción o devolver los errores.
            throw new \Exception('Errores de verificación previa: ' . json_encode($erroresPrevia));
        }

        DB::beginTransaction();

        try {
            $listaInscripcion = ListaInscripcion::create([
                'codigo_lista' => null, // Esto podría generarse aquí si no viene del cliente
                'id_unidad_educativa' => null, // Se actualizará si hay una UE predominante o se puede omitir
                'fecha_creacion' => now()
            ]);

            $montoTotal = 0;
            $firstUnidadEducativaId = null; // Para asignar a lista_inscripcion si se desea

            foreach ($data['lista_inscripcion'] as $inscripcionData) {
                // 1. Crear o actualizar unidad educativa
                $idUnidadEducativa = $this->findOrCreateUnidadEducativa($inscripcionData['unidad_educativa']);
                if ($firstUnidadEducativaId === null) {
                    $firstUnidadEducativaId = $idUnidadEducativa;
                }

                // 2. Crear o actualizar tutor legal
                $tutorLegal = $this->findOrCreateTutorLegal($inscripcionData['tutor_legal']);

                // 3. Crear o actualizar estudiante
                $estudiante = $this->findOrCreateEstudiante($inscripcionData, $idUnidadEducativa, $tutorLegal->id_tutor_legal);

                // 4. Crear inscripciones de detalle y tutores académicos
                foreach ($inscripcionData['areas_seleccionadas'] as $areaSeleccionada) {
                    $idConvocatoriaNivel = $areaSeleccionada['id_convocatoria_nivel'];
                    $tutorAcademico = $this->findOrCreateTutorAcademico($inscripcionData['tutores_academicos'] ?? [], $idConvocatoriaNivel);

                    DetalleListaInscripcion::create([
                        'id_lista' => $listaInscripcion->id_lista,
                        'id_estudiante' => $estudiante->id_estudiante,
                        'id_convocatoria_nivel' => $idConvocatoriaNivel,
                        'id_tutor_academico' => $tutorAcademico->id_tutor_academico,
                        'fecha_registro' => now(),
                    ]);

                    $convocatoriaNivel = ConvocatoriaNivel::with('convocatoriaArea')->find($idConvocatoriaNivel);
                    $montoTotal += $convocatoriaNivel->convocatoriaArea->costo_inscripcion;
                }
            }

            // Actualizar el id_unidad_educativa de ListaInscripcion si es aplicable
            if ($firstUnidadEducativaId) {
                $listaInscripcion->update(['id_unidad_educativa' => $firstUnidadEducativaId]);
            }

            // 5. Crear orden de pago
            $ordenPago = OrdenPago::create([
                'codigo_unico' => $data['codigo_unico'],
                'tipo_origen' => 'lista',
                'id_inscripcion' => null,
                'id_lista' => $listaInscripcion->id_lista,
                'monto_total' => $montoTotal,
                'fecha_emision' => now(),
                'fecha_vencimiento' => now()->addDays(5),
                'estado' => 'pendiente',
            ]);

            // 6. Crear el encargado de pago
            $encargadoPago = EncargadoPago::create([
                'id_lista' => $listaInscripcion->id_lista,
                'nombres' => $data['encargado_pago']['nombres_encargado'],
                'apellidos' => $data['encargado_pago']['apellidos_encargado'],
                'ci' => $data['encargado_pago']['ci_encargado'],
                'email' => $data['encargado_pago']['email_encargado'],
            ]);

            DB::commit();

            return [
                'lista_inscripcion' => $listaInscripcion,
                'orden_pago' => $ordenPago,
                'encargado_pago' => $encargadoPago,
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e; // Relanzar la excepción para que el controlador la maneje
        }
    }

    private function findOrCreateUnidadEducativa(array $data): int
    {
        if (isset($data['id_unidad_educativa'])) {
            return $data['id_unidad_educativa'];
        }

        $nombre = $data['nombre'] ?? 'Colegio Desconocido';
        $departamento = $data['departamento'] ?? 'No Especificado';
        $provincia = $data['provincia'] ?? 'No Especificado';

        $unidadEducativa = UnidadEducativa::firstOrCreate(
            ['nombre' => $nombre, 'departamento' => $departamento, 'provincia' => $provincia],
            ['nombre' => $nombre, 'departamento' => $departamento, 'provincia' => $provincia] // Datos para crear si no existe
        );
        return $unidadEducativa->id_unidad_educativa;
    }

    private function findOrCreateTutorLegal(array $data): TutorLegal
    {
        $data['email'] = $data['email'] ?? 'tutor.sin.email@miinstitucion.edu.bo';
        $data['telefono'] = $data['telefono'] ?? 'Sin Teléfono';
        $data['parentesco'] = $data['parentesco'] ?? 'No Especificado';

        return TutorLegal::updateOrCreate(
            ['ci' => $data['ci']],
            $data
        );
    }

    private function findOrCreateEstudiante(array $estudianteData, int $idUnidadEducativa, int $idTutorLegal): Estudiante
    {
        $estudianteData['email'] = $estudianteData['email'] ?? 'estudiante.no.tiene.correo@miinstitucion.edu.bo';
        $estudianteData['genero'] = $estudianteData['genero'] ?? 'No Especificado';
        $estudianteData['telefono'] = $estudianteData['telefono'] ?? '0'; // Asegúrate que sea string o int según tu DB
        $estudianteData['departamento'] = $estudianteData['departamento'] ?? 'No Especificado';
        $estudianteData['provincia'] = $estudianteData['provincia'] ?? 'No Especificado';
        
        $dataToUpdate = [
            'nombres' => $estudianteData['nombres'],
            'apellidos' => $estudianteData['apellidos'],
            'genero' => $estudianteData['genero'],
            'fecha_nacimiento' => $estudianteData['fecha_nacimiento'],
            'id_unidad_educativa' => $idUnidadEducativa,
            'id_grado' => $estudianteData['id_grado'],
            'id_tutor_legal' => $idTutorLegal,
            'email' => $estudianteData['email'],
            'telefono' => $estudianteData['telefono'],
            'departamento' => $estudianteData['departamento'],
            'provincia' => $estudianteData['provincia'],
        ];

        return Estudiante::updateOrCreate(
            ['ci' => $estudianteData['ci']],
            $dataToUpdate
        );
    }

    private function findOrCreateTutorAcademico(array $tutoresAcademicosData, int $idConvocatoriaNivel): TutorAcademico
    {
        $tutorData = collect($tutoresAcademicosData)->firstWhere('id_convocatoria_nivel', $idConvocatoriaNivel);

        $nombres = $tutorData['nombres'] ?? 'Sin Nombre Asignado';
        $apellidos = $tutorData['apellidos'] ?? 'Sin Apellido Asignado';
        $ci = $tutorData['ci'] ?? 'SN';
        $telefono = $tutorData['telefono'] ?? 'No Registrado';
        $email = $tutorData['email'] ?? 'tutoracademico.no.email@miinstitucion.edu.bo';

        return TutorAcademico::updateOrCreate(
            ['ci' => $ci], // Asume que el CI es único para tutores académicos
            compact('nombres', 'apellidos', 'ci', 'telefono', 'email')
        );
    }
}
