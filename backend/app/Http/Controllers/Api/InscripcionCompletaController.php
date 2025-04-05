<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Estudiante;
use App\Models\Inscripcion;
use App\Models\OrdenPago;
use App\Models\TutorAcademico;
use App\Models\TutorLegal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class InscripcionCompletaController extends ApiController
{
    /**
     * Realiza el proceso completo de inscripción en una sola petición
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function inscribirEstudiante(Request $request): JsonResponse
    {
        // Validar datos de entrada
        $validator = Validator::make($request->all(), [
            // Datos del estudiante
            'estudiante.nombres' => 'required|string|max:100',
            'estudiante.apellidos' => 'required|string|max:100',
            'estudiante.ci' => 'required|string|max:20',
            'estudiante.fecha_nacimiento' => 'required|date',
            'estudiante.email' => 'nullable|email|max:100',
            'estudiante.id_unidad_educativa' => 'required|exists:unidades_educativas,id_unidad_educativa',
            'estudiante.id_grado' => 'required|exists:grados,id_grado',
            
            // Datos del tutor legal
            'tutor_legal.nombres' => 'required|string|max:100',
            'tutor_legal.apellidos' => 'required|string|max:100',
            'tutor_legal.ci' => 'required|string|max:20',
            'tutor_legal.telefono' => 'required|string|max:20',
            'tutor_legal.email' => 'nullable|email|max:100',
            'tutor_legal.parentesco' => 'required|string|max:50',
            'tutor_legal.es_el_mismo_estudiante' => 'boolean',
            
            // Datos del tutor académico (opcional)
            'tutor_academico.nombres' => 'nullable|string|max:100',
            'tutor_academico.apellidos' => 'nullable|string|max:100',
            'tutor_academico.ci' => 'nullable|string|max:20',
            'tutor_academico.telefono' => 'nullable|string|max:20',
            'tutor_academico.email' => 'nullable|email|max:100',
            
            // Áreas seleccionadas
            'areas_seleccionadas' => 'required|array|min:1',
            'areas_seleccionadas.*.id_convocatoria_area' => 'required|exists:convocatoria_areas,id_convocatoria_area',
            'areas_seleccionadas.*.id_convocatoria_nivel' => 'required|exists:convocatoria_niveles,id_convocatoria_nivel',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        // Iniciar transacción
        DB::beginTransaction();
        
        try {
            // 1. Crear o actualizar tutor legal
            $tutorLegalData = $request->input('tutor_legal');
            $tutorLegal = $this->crearOActualizarTutorLegal($tutorLegalData);
            
            // 2. Crear o actualizar estudiante
            $estudianteData = $request->input('estudiante');
            $estudianteData['id_tutor_legal'] = $tutorLegal->id_tutor_legal;
            $estudiante = $this->crearOActualizarEstudiante($estudianteData);
            
            // 3. Crear o actualizar tutor académico (si existe)
            $tutorAcademico = null;
            if ($request->has('tutor_academico') && $request->input('tutor_academico')) {
                $tutorAcademicoData = $request->input('tutor_academico');
                $tutorAcademico = $this->crearOActualizarTutorAcademico($tutorAcademicoData);
            }
            
            // 4. Crear inscripciones
            $inscripciones = [];
            $costoTotal = 0;
            
            foreach ($request->input('areas_seleccionadas') as $areaSeleccionada) {
                $inscripcion = new Inscripcion([
                    'id_estudiante' => $estudiante->id_estudiante,
                    'id_convocatoria_area' => $areaSeleccionada['id_convocatoria_area'],
                    'id_convocatoria_nivel' => $areaSeleccionada['id_convocatoria_nivel'],
                    'id_tutor_academico' => $tutorAcademico ? $tutorAcademico->id_tutor_academico : null,
                    'fecha_inscripcion' => now(),
                    'estado' => 'pendiente'
                ]);
                
                $inscripcion->save();
                $inscripciones[] = $inscripcion;
                
                // Sumar el costo de la inscripción
                $costoInscripcion = $inscripcion->convocatoriaArea->costo_inscripcion;
                $costoTotal += $costoInscripcion;
            }
            
            // 5. Crear orden de pago
            $ordenPago = new OrdenPago([
                'codigo_unico' => 'OP-' . strtoupper(Str::random(8)),
                'tipo_origen' => 'individual',
                'id_inscripcion' => $inscripciones[0]->id_inscripcion, // Primera inscripción
                'monto_total' => $costoTotal,
                'fecha_emision' => now(),
                'fecha_vencimiento' => now()->addDays(5), // 5 días para pagar
                'estado' => 'pendiente'
            ]);
            
            $ordenPago->save();
            
            // Confirmar transacción
            DB::commit();
            
            // Retornar respuesta exitosa
            return $this->successResponse([
                'estudiante' => $estudiante,
                'inscripciones' => $inscripciones,
                'orden_pago' => $ordenPago,
                'costo_total' => $costoTotal
            ], 'Inscripción realizada correctamente', 201);
            
        } catch (\Exception $e) {
            // Revertir transacción en caso de error
            DB::rollBack();
            return $this->errorResponse('Error al realizar la inscripción: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Crea o actualiza un tutor legal
     */
    private function crearOActualizarTutorLegal(array $data): TutorLegal
    {
        // Buscar por CI
        $tutorLegal = TutorLegal::where('ci', $data['ci'])->first();
        
        if ($tutorLegal) {
            $tutorLegal->update($data);
        } else {
            $tutorLegal = TutorLegal::create($data);
        }
        
        return $tutorLegal;
    }
    
    /**
     * Crea o actualiza un estudiante
     */
    private function crearOActualizarEstudiante(array $data): Estudiante
    {
        // Buscar por CI
        $estudiante = Estudiante::where('ci', $data['ci'])->first();
        
        if ($estudiante) {
            $estudiante->update($data);
        } else {
            $estudiante = Estudiante::create($data);
        }
        
        return $estudiante;
    }
    
    /**
     * Crea o actualiza un tutor académico
     */
    private function crearOActualizarTutorAcademico(array $data): ?TutorAcademico
    {
        if (empty($data['nombres']) || empty($data['apellidos'])) {
            return null;
        }
        
        // Buscar por CI si existe
        $tutorAcademico = null;
        if (!empty($data['ci'])) {
            $tutorAcademico = TutorAcademico::where('ci', $data['ci'])->first();
        }
        
        if ($tutorAcademico) {
            $tutorAcademico->update($data);
        } else {
            $tutorAcademico = TutorAcademico::create($data);
        }
        
        return $tutorAcademico;
    }
}
