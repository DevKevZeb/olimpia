<?php

namespace App\Http\Controllers\Api;

use App\Models\Grado;
use App\Models\OrdenPago;
use App\Models\Estudiante;
use App\Models\TutorLegal;
use App\Models\Inscripcion;
use Illuminate\Support\Str;
use App\Models\Convocatoria;
use Illuminate\Http\Request;
use App\Models\TutorAcademico;
use App\Models\UnidadEducativa;
use App\Models\ListaInscripcion;
use App\Models\ConvocatoriaNivel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\DetalleListaInscripcion;
use Illuminate\Support\Facades\Validator;

class InscripcionCompletaController extends ApiController
{
    /**
     * Obtiene las áreas y niveles disponibles según el grado seleccionado
     */
    public function getAreasPorGrado(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_grado' => 'required|exists:grados,id_grado',
            'id_convocatoria' => 'required|exists:convocatorias,id_convocatoria'
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        $idGrado = $request->id_grado;
        $idConvocatoria = $request->id_convocatoria;

        // Obtener la convocatoria para verificar el máximo de áreas permitidas
        $convocatoria = Convocatoria::find($idConvocatoria);
        if (!$convocatoria) {
            return $this->errorResponse('Convocatoria no encontrada', 404);
        }

        // Verificar que la convocatoria esté abierta
        if ($convocatoria->estado !== 'abierta') {
            return $this->errorResponse('La convocatoria no está abierta para inscripciones', 422);
        }

        // Obtener las áreas y niveles disponibles para el grado seleccionado
        $areasNiveles = ConvocatoriaNivel::with(['convocatoriaArea.area', 'nivel'])
            ->whereHas('convocatoriaArea', function ($query) use ($idConvocatoria) {
                $query->where('id_convocatoria', $idConvocatoria);
            })
            ->where('id_grado_min', '<=', $idGrado)
            ->where('id_grado_max', '>=', $idGrado)
            ->get()
            ->map(function ($nivel) {
                return [
                    'id_convocatoria_nivel' => $nivel->id_convocatoria_nivel,
                    'area' => [
                        'id' => $nivel->convocatoriaArea->area->id_area,
                        'nombre' => $nivel->convocatoriaArea->area->nombre_area,
                    ],
                    'nivel' => [
                        'id' => $nivel->nivel->id_nivel,
                        'nombre' => $nivel->nivel->nombre_nivel,
                    ],
                    'costo' => $nivel->convocatoriaArea->costo_inscripcion,
                ];
            });

        return $this->successResponse([
            'areas_niveles' => $areasNiveles,
            'max_areas_permitidas' => $convocatoria->max_areas_por_estudiante
        ], 'Áreas y niveles obtenidos correctamente');
    }


    
    public function inscribirEstudiante(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'lista_inscripcion' => 'required|array',
            'id_convocatoria' => 'required|string',
            'codigo_unico' => 'required|string'
    ]);

        Log::info("esto nos llega" . json_encode($request->all()));
        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        $convocatoria = Convocatoria::find($request->id_convocatoria);
        if (!$convocatoria || $convocatoria->estado !== 'abierta') {
            return $this->errorResponse('La convocatoria no está abierta para inscripciones', 422);
        }
        DB::beginTransaction();


        $listaInscripcion = ListaInscripcion::create([
            'codigo_lista' => null,
            'id_unidad_educativa' => null,
            'fecha_creacion' => now()
        ]);
        $montoTotal = 0;
        $inscripciones = $request->lista_inscripcion;

        foreach( $inscripciones as $inscripcion){
            Log::info("Datos de unidad_educativa antes de validar: " . json_encode($inscripcion['unidad_educativa']));
            Log::info("inscripcion " . json_encode($inscripcion) . "  " . gettype($inscripcion) );
            $validator = Validator::make($inscripcion, [
                // Datos del estudiante
                'nombres' => 'required|string|max:100',
                'apellidos' => 'required|string|max:100',
                'ci' => 'required|string|max:20',
                'fecha_nacimiento' => 'nullable|required|date',
                'email' => 'nullable|email|max:100',
                'id_grado' => 'required|exists:grados,id_grado',
                
                // Datos de la unidad educativa
                'unidad_educativa' => 'required|array',
                'unidad_educativa.id_unidad_educativa' => 'nullable|exists:unidades_educativas,id_unidad_educativa',
                'unidad_educativa.nombre' => 'nullable|required_without:unidad_educativa.id_unidad_educativa|string|max:200',
                //'unidad_educativa.departamento' => 'nullable|required_without:unidad_educativa.id_unidad_educativa|string|max:50',
                'unidad_educativa.departamento' => 'nullable|string|max:50',
                'unidad_educativa.provincia' => 'nullable|string|max:50',
                //'unidad_educativa.provincia' => 'nullable|required_without:unidad_educativa.id_unidad_educativa|string|max:50',            
                // Datos del tutor legal
                'tutor_legal' => 'required|array',
                'tutor_legal.nombres' => 'required|string|max:100',
                'tutor_legal.apellidos' => 'required|string|max:100',
                'tutor_legal.ci' => 'required|string|max:20',
                'tutor_legal.telefono' => 'nullable|required|string|max:20',
                'tutor_legal.email' => 'nullable|email|max:100',
                'tutor_legal.parentesco' => 'nullable|required|string|max:50',
                'tutor_legal.es_el_mismo_estudiante' => 'required|boolean',
                
                // Datos de la convocatoria y áreas seleccionadas
   //             'id_convocatoria' => 'required|exists:convocatorias,id_convocatoria',
                'areas_seleccionadas' => 'required|array|min:1',
                'areas_seleccionadas.*.id_convocatoria_nivel' => 'required|exists:convocatoria_niveles,id_convocatoria_nivel',
                
                // Datos de tutores académicos (uno por área)
                'tutores_academicos' => 'array',
                'tutores_academicos.*.id_convocatoria_nivel' => 'nullable|exists:convocatoria_niveles,id_convocatoria_nivel',
                'tutores_academicos.*.nombres' => 'nullable|string|max:100',
                'tutores_academicos.*.apellidos' => 'nullable|string|max:100',
                'tutores_academicos.*.ci' => 'nullable|string|max:20',
                'tutores_academicos.*.telefono' => 'nullable|string|max:20',
                'tutores_academicos.*.email' => 'nullable|email|max:100',
            ]);

            if ($validator->fails()) {
                return $this->errorResponse($validator->errors()->first(), 422);
            }
            
            // Verificar que no se exceda el máximo de áreas permitidas
            if (count($inscripcion['areas_seleccionadas']) > $convocatoria->max_areas_por_estudiante) {
                return $this->errorResponse(
                    "Se ha excedido el máximo de áreas permitidas ({$convocatoria->max_areas_por_estudiante})",
                    422
                );
            }
            
            // Verificar que cada área seleccionada tenga un tutor académico
            foreach ($inscripcion['areas_seleccionadas'] as $area) {
                $tieneTutor = false;
                foreach ($inscripcion['tutores_academicos'] as $tutor) {
                    if ($tutor['id_convocatoria_nivel'] == $area['id_convocatoria_nivel']) {
                        $tieneTutor = true;
                        break;
                    }
                }
            }
            
            // Iniciar transacción
            
            try {
                // 1. Crear o actualizar unidad educativa
                $idUnidadEducativa = null;
                if (isset($inscripcion['unidad_educativa']['id_unidad_educativa'])) {
                    $idUnidadEducativa = $inscripcion['unidad_educativa']['id_unidad_educativa'];
                } else {
                    $unidadEducativaDepartamento = $inscripcion['unidad_educativa']['departamento'] ?? '';
                    $unidadEducativaProvincia = $inscripcion['unidad_educativa']['provincia'] ?? '';
                    $unidadEducativaNombre = $inscripcion['unidad_educativa']['nombre'] ?? '';

                    $departamentoParaGuardar = $unidadEducativaDepartamento !== "" ? $unidadEducativaDepartamento : 'No Especificado';
                    $provinciaParaGuardar = $unidadEducativaProvincia !== "" ? $unidadEducativaProvincia : 'No Especificado';
                    $nombreParaGuardar = $unidadEducativaNombre !== "" ? $unidadEducativaNombre : 'Colegio Desconocido';

                    if ($unidadEducativaDepartamento !== "" && $unidadEducativaProvincia !== "") {
                        $unidadEducativa = UnidadEducativa::create([
                            'nombre' => 'Colegio No Especificado',
                            'departamento' => $departamentoParaGuardar,
                            'provincia' => $provinciaParaGuardar,
                        ]);
                        $idUnidadEducativa = $unidadEducativa->id_unidad_educativa;
                    } else {
                        $unidadEducativa = UnidadEducativa::create([
                            'nombre' => $nombreParaGuardar,
                            'departamento' => $departamentoParaGuardar,
                            'provincia' => $provinciaParaGuardar,
                        ]);
                        $idUnidadEducativa = $unidadEducativa->id_unidad_educativa;
                    }
                }

                Log::info('ID Unidad Educativa (inscribirEstudiante): ' . $idUnidadEducativa); // <--- Asegúrate de que esta línea esté aquí

                // 2. Crear tutor legal
                $tutorLegalEmail = $inscripcion['tutor_legal']['email'] ?? '';
                if ($tutorLegalEmail === "") {
                    $tutorLegalEmail = 'tutor.sin.email@miinstitucion.edu.bo';
                }

                $tutorLegalTelefono = $inscripcion['tutor_legal']['telefono'] ?? '';
                if ($tutorLegalTelefono === "") {
                    $tutorLegalTelefono = 'Sin Teléfono'; // Tu valor genérico
                }

                $tutorLegalParentesco = $inscripcion['tutor_legal']['parentesco'] ?? '';
                if ($tutorLegalParentesco === "") {
                    $tutorLegalParentesco = 'No Especificado'; // Tu valor genérico
                }

                $tutorLegalData = [
                    'nombres' => $inscripcion['tutor_legal']['nombres'],
                    'apellidos' => $inscripcion['tutor_legal']['apellidos'],
                    'ci' => $inscripcion['tutor_legal']['ci'],
                    'telefono' => $tutorLegalTelefono,
                    'email' => $tutorLegalEmail,
                    'parentesco' => $tutorLegalParentesco,
                    'es_el_mismo_estudiante' => $inscripcion['tutor_legal']['es_el_mismo_estudiante'],
                ];
                $tutorLegal = TutorLegal::create($tutorLegalData);

                // 3. Crear estudiante
                $estudianteEmail = $inscripcion['email'] ?? '';
                if ($estudianteEmail === "") {
                    $estudianteEmail = 'estudiante.no.tiene.correo@miinstitucion.edu.bo';
                }

                $estudianteTelefono = $inscripcion['telefono'] ?? '';
                if ($estudianteTelefono === "") {
                    $estudianteTelefono = 'Sin Teléfono'; // Tu valor genérico
                }

                $estudianteDepartamento = $inscripcion['departamento'] ?? '';
                if ($estudianteDepartamento === "") {
                    $estudianteDepartamento = 'No Especificado'; // Tu valor genérico
                }

                $estudianteProvincia = $inscripcion['provincia'] ?? '';
                if ($estudianteProvincia === "") {
                    $estudianteProvincia = 'No Especificado'; // Tu valor genérico
                }

                print($idUnidadEducativa);

                $estudianteData = [
                    'nombres' => $inscripcion['nombres'],
                    'apellidos' => $inscripcion['apellidos'],
                    'ci' => $inscripcion['ci'],
                    'fecha_nacimiento' => $inscripcion['fecha_nacimiento'], // Aunque es nullable|required, lo dejamos tal cual para no romper la validación
                    'id_unidad_educativa' => $idUnidadEducativa, // Este ya se maneja en la lógica anterior
                    'id_grado' => $inscripcion['id_grado'],
                    'id_tutor_legal' => $tutorLegal->id_tutor_legal,
                    'email' => $estudianteEmail,
                    'telefono' => $estudianteTelefono,
                    'departamento' => $estudianteDepartamento,
                    'provincia' => $estudianteProvincia,
                ];
                $estudiante = Estudiante::create($estudianteData);

                // 4. Crear inscripciones y tutores académicos para cada área seleccionada
                foreach ($inscripcion['areas_seleccionadas'] as $areaSeleccionada) {
                    $tutorData = null;
                    foreach ($inscripcion['tutores_academicos'] as $tutor) {
                        if ($tutor['id_convocatoria_nivel'] == $areaSeleccionada['id_convocatoria_nivel']) {
                            $tutorData = $tutor;
                            break;
                        }
                    }

                    $tutorAcademicoNombres = $tutorData['nombres'] ?? '';
                    if ($tutorAcademicoNombres === "") {
                        $tutorAcademicoNombres = 'Sin Nombre Asignado'; // ¡Tu valor!
                    }

                    $tutorAcademicoApellidos = $tutorData['apellidos'] ?? '';
                    if ($tutorAcademicoApellidos === "") {
                        $tutorAcademicoApellidos = 'Sin Apellido Asignado'; // ¡Tu decisión!
                    }

                    $tutorAcademicoCi = $tutorData['ci'] ?? null;
                    if ($tutorAcademicoCi === "") {
                        $tutorAcademicoCi = 'SN'; // ¡Tú mandas!
                    }

                    $tutorAcademicoTelefono = $tutorData['telefono'] ?? '';
                    if ($tutorAcademicoTelefono === "") {
                        $tutorAcademicoTelefono = 'No Registrado'; // ¡Tu elección!
                    }

                    $tutorAcademicoEmail = $tutorData['email'] ?? '';
                    if ($tutorAcademicoEmail === "") {
                        $tutorAcademicoEmail = 'tutoracademico.no.email@miinstitucion.edu.bo'; // ¡Tu directiva!
                    }

                    $tutorAcademicoData = [
                        'nombres' => $tutorAcademicoNombres,
                        'apellidos' => $tutorAcademicoApellidos,
                        'ci' => $tutorAcademicoCi,
                        'telefono' => $tutorAcademicoTelefono,
                        'email' => $tutorAcademicoEmail,
                        'id_convocatoria_nivel' => $areaSeleccionada['id_convocatoria_nivel'],
                    ];
                    $tutorAcademico = TutorAcademico::create($tutorAcademicoData);

                    if($this->estaInscritoArea( $estudiante->ci ,$areaSeleccionada['id_convocatoria_nivel']))
                    {
                       DB::rollBack();
                       return $this->errorResponse('Error al procesar la inscripción: El estudiante ya esta inscrito en la materia ' , 409);
                    }

                    DetalleListaInscripcion::create([
                        'id_lista' => $listaInscripcion->id_lista,
                        'id_estudiante' => $estudiante->id_estudiante,
                        'id_convocatoria_nivel' => $areaSeleccionada['id_convocatoria_nivel'],
                        'id_tutor_academico' => $tutorAcademico->id_tutor_academico,
                        'fecha_registro' => now(),
                    ]);

                    $convocatoriaNivel = ConvocatoriaNivel::with('convocatoriaArea')->find($areaSeleccionada['id_convocatoria_nivel']);
                    $montoTotal += $convocatoriaNivel->convocatoriaArea->costo_inscripcion;
                }

            } catch (\Exception $e) {
                DB::rollBack();
                return $this->errorResponse('Error al procesar la inscripción: ' . $e->getMessage(), 500);
            }
        }
        
        try{
            // 5. Crear orden de pago
            $ordenPago = OrdenPago::create([
                'codigo_unico' => $request->codigo_unico,
                'tipo_origen' => 'lista',
                'id_inscripcion' => null, // Asociamos a la primera inscripción
                'id_lista' => $listaInscripcion->id_lista,
                'monto_total' => $montoTotal,
                'fecha_emision' => now(),
                'fecha_vencimiento' => now()->addDays(5), // 5 días para pagar
                'estado' => 'pendiente',
            ]);

            DB::commit();

            return $this->successResponse([
                'estudiante' => $estudiante,
                'inscripciones' => $listaInscripcion,  
                'orden_pago' => $ordenPago,
            ], 'Inscripción completada correctamente', 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse('Error al procesar la inscripción: ' . $e->getMessage(), 500);
        }
       
    }

    public function estaInscritoArea($ci_estudiante, $id_categoria_nivel)
    {
       $inscripcion = DB::select('
        SELECT id_detalle
        FROM detalles_lista_inscripcion dli, estudiantes e
        WHERE dli.id_estudiante = e.id_estudiante
        AND e.ci = ?
        AND dli.id_convocatoria_nivel = ?
        ' , [$ci_estudiante, $id_categoria_nivel] );

        return !empty($inscripcion);
    }

    /**
     * Procesa la inscripción completa de un estudiante
     */
    public function inscribirEstud(Request $request)
    {
        $validator = Validator::make($request->all(), [
            // Datos del estudiante
            'nombres' => 'required|string|max:100',
            'apellidos' => 'required|string|max:100',
            'ci' => 'required|string|max:20',
            'fecha_nacimiento' => 'nullable|required|date',
            'email' => 'nullable|email|max:100',
            'id_grado' => 'required|exists:grados,id_grado',
            
            // Datos de la unidad educativa
            'unidad_educativa' => 'required|array',
            'unidad_educativa.id_unidad_educativa' => 'nullable|exists:unidades_educativas,id_unidad_educativa',
            'unidad_educativa.nombre' => 'nullable|required_without:unidad_educativa.id_unidad_educativa|string|max:200',
            //'unidad_educativa.departamento' => 'nullable|required_without:unidad_educativa.id_unidad_educativa|string|max:50',
            'unidad_educativa.departamento' => 'nullable|string|max:50',
            'unidad_educativa.provincia' => 'nullable|string|max:50',
            //'unidad_educativa.provincia' => 'nullable|required_without:unidad_educativa.id_unidad_educativa|string|max:50',            
            // Datos del tutor legal
            'tutor_legal' => 'required|array',
            'tutor_legal.nombres' => 'required|string|max:100',
            'tutor_legal.apellidos' => 'required|string|max:100',
            'tutor_legal.ci' => 'required|string|max:20',
            'tutor_legal.telefono' => 'nullable|required|string|max:20',
            'tutor_legal.email' => 'nullable|email|max:100',
            'tutor_legal.parentesco' => 'nullable|required|string|max:50',
            'tutor_legal.es_el_mismo_estudiante' => 'required|boolean',
            
            // Datos de la convocatoria y áreas seleccionadas
            'id_convocatoria' => 'required|exists:convocatorias,id_convocatoria',
            'areas_seleccionadas' => 'required|array|min:1',
            'areas_seleccionadas.*.id_convocatoria_nivel' => 'required|exists:convocatoria_niveles,id_convocatoria_nivel',
            
            // Datos de tutores académicos (uno por área)
            'tutores_academicos' => 'required|array',
            'tutores_academicos.*.id_convocatoria_nivel' => 'required|exists:convocatoria_niveles,id_convocatoria_nivel',
            'tutores_academicos.*.nombres' => 'required|string|max:100',
            'tutores_academicos.*.apellidos' => 'required|string|max:100',
            'tutores_academicos.*.ci' => 'nullable|string|max:20',
            'tutores_academicos.*.telefono' => 'required|string|max:20',
            'tutores_academicos.*.email' => 'nullable|email|max:100',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        // Verificar que la convocatoria esté abierta
        $convocatoria = Convocatoria::find($request->id_convocatoria);
        if (!$convocatoria || $convocatoria->estado !== 'abierta') {
            return $this->errorResponse('La convocatoria no está abierta para inscripciones', 422);
        }

        // Verificar que no se exceda el máximo de áreas permitidas
        if (count($request->areas_seleccionadas) > $convocatoria->max_areas_por_estudiante) {
            return $this->errorResponse(
                "Se ha excedido el máximo de áreas permitidas ({$convocatoria->max_areas_por_estudiante})",
                422
            );
        }

        // Verificar que cada área seleccionada tenga un tutor académico
        foreach ($request->areas_seleccionadas as $area) {
            $tieneTutor = false;
            foreach ($request->tutores_academicos as $tutor) {
                if ($tutor['id_convocatoria_nivel'] == $area['id_convocatoria_nivel']) {
                    $tieneTutor = true;
                    break;
                }
            }
            if (!$tieneTutor) {
                return $this->errorResponse(
                    'Cada área seleccionada debe tener un tutor académico asignado',
                    422
                );
            }
        }

        // Iniciar transacción
        DB::beginTransaction();

        try {
            // 1. Crear o actualizar unidad educativa
            $idUnidadEducativa = null;
            if (isset($request->unidad_educativa['id_unidad_educativa'])) {
                $idUnidadEducativa = $request->unidad_educativa['id_unidad_educativa'];
            } else {
                $unidadEducativaDepartamento = $request->unidad_educativa['departamento'] ?? '';
                $unidadEducativaProvincia = $request->unidad_educativa['provincia'] ?? '';
                $unidadEducativaNombre = $request->unidad_educativa['nombre'] ?? '';

                $departamentoParaGuardar = $unidadEducativaDepartamento !== "" ? $unidadEducativaDepartamento : 'No Especificado';
                $provinciaParaGuardar = $unidadEducativaProvincia !== "" ? $unidadEducativaProvincia : 'No Especificado';
                $nombreParaGuardar = $unidadEducativaNombre !== "" ? $unidadEducativaNombre : 'Colegio Desconocido';

                if ($unidadEducativaDepartamento !== "" && $unidadEducativaProvincia !== "") {
                    $unidadEducativa = UnidadEducativa::create([
                        'nombre' => 'Colegio No Especificado',
                        'departamento' => $departamentoParaGuardar,
                        'provincia' => $provinciaParaGuardar,
                    ]);
                    $idUnidadEducativa = $unidadEducativa->id_unidad_educativa;
                } else {
                    $unidadEducativa = UnidadEducativa::create([
                        'nombre' => $nombreParaGuardar,
                        'departamento' => $departamentoParaGuardar,
                        'provincia' => $provinciaParaGuardar,
                    ]);
                    $idUnidadEducativa = $unidadEducativa->id_unidad_educativa;
                }
            }

            Log::info('ID Unidad Educativa (inscribirEstud): ' . $idUnidadEducativa); // <--- Asegúrate de que esta línea esté aquí

            // 2. Crear tutor legal
            $tutorLegalEmail = $request->tutor_legal['email'] ?? '';
            if ($tutorLegalEmail === "") {
                $tutorLegalEmail = 'tutor.sin.email@miinstitucion.edu.bo';
            }

            $tutorLegalTelefono = $request->tutor_legal['telefono'] ?? '';
            if ($tutorLegalTelefono === "") {
                $tutorLegalTelefono = 'Sin Teléfono'; // Tu valor genérico
            }

            $tutorLegalParentesco = $request->tutor_legal['parentesco'] ?? '';
            if ($tutorLegalParentesco === "") {
                $tutorLegalParentesco = 'No Especificado'; // Tu valor genérico
            }

            $tutorLegalData = [
                'nombres' => $request->tutor_legal['nombres'],
                'apellidos' => $request->tutor_legal['apellidos'],
                'ci' => $request->tutor_legal['ci'],
                'telefono' => $tutorLegalTelefono,
                'email' => $tutorLegalEmail,
                'parentesco' => $tutorLegalParentesco,
                'es_el_mismo_estudiante' => $request->tutor_legal['es_el_mismo_estudiante'],
            ];
            $tutorLegal = TutorLegal::create($tutorLegalData);

            // 3. Crear estudiante
            $estudianteEmail = $request->email ?? '';
            if ($estudianteEmail === "") {
                $estudianteEmail = 'estudiante.no.tiene.correo@miinstitucion.edu.bo';
            }

            $estudianteTelefono = $request->telefono ?? '';
            if ($estudianteTelefono === "") {
                $estudianteTelefono = 'Sin Teléfono'; // Tu valor genérico
            }

            $estudianteDepartamento = $request->departamento ?? '';
            if ($estudianteDepartamento === "") {
                $estudianteDepartamento = 'No Especificado'; // Tu valor genérico
            }

            $estudianteProvincia = $request->provincia ?? '';
            if ($estudianteProvincia === "") {
                $estudianteProvincia = 'No Especificado'; // Tu valor genérico
            }

            $estudianteData = [
                'nombres' => $request->nombres,
                'apellidos' => $request->apellidos,
                'ci' => $request->ci,
                'fecha_nacimiento' => $request->fecha_nacimiento, // Igual que en inscribirEstudiante
                'id_unidad_educativa' => $idUnidadEducativa, // Ya se maneja
                'id_grado' => $request->id_grado,
                'id_tutor_legal' => $tutorLegal->id_tutor_legal,
                'email' => $estudianteEmail,
                'telefono' => $estudianteTelefono,
                'departamento' => $estudianteDepartamento,
                'provincia' => $estudianteProvincia,
            ];
            $estudiante = Estudiante::create($estudianteData);

            // 4. Crear inscripciones y tutores académicos para cada área seleccionada
            $inscripciones = [];
            $montoTotal = 0;

            foreach ($request->areas_seleccionadas as $areaSeleccionada) {
                // Buscar el tutor académico para esta área
                $tutorData = null;
                foreach ($request->tutores_academicos as $tutor) {
                    if ($tutor['id_convocatoria_nivel'] == $areaSeleccionada['id_convocatoria_nivel']) {
                        $tutorData = $tutor;
                        break;
                    }
                }

                $tutorAcademicoNombres = $tutorData['nombres'] ?? '';
                if ($tutorAcademicoNombres === "") {
                    $tutorAcademicoNombres = 'Nombre Tutor Defecto'; // ¡Tu asignación!
                }

                $tutorAcademicoApellidos = $tutorData['apellidos'] ?? '';
                if ($tutorAcademicoApellidos === "") {
                    $tutorAcademicoApellidos = 'Apellido Tutor Defecto'; // ¡Tu elección!
                }

                $tutorAcademicoCi = $tutorData['ci'] ?? null;
                if ($tutorAcademicoCi === "") {
                    $tutorAcademicoCi = '000000'; // ¡Tu valor predeterminado!
                }

                $tutorAcademicoTelefono = $tutorData['telefono'] ?? '';
                if ($tutorAcademicoTelefono === "") {
                    $tutorAcademicoTelefono = 'Sin Telefono'; // ¡Tu decisión!
                }

                $tutorAcademicoEmail = $tutorData['email'] ?? '';
                if ($tutorAcademicoEmail === "") {
                    $tutorAcademicoEmail = 'tutoracademico.default@miinstitucion.edu.bo'; // ¡Tu directiva!
                }

                $tutorAcademicoData = [
                    'nombres' => $tutorAcademicoNombres,
                    'apellidos' => $tutorAcademicoApellidos,
                    'ci' => $tutorAcademicoCi,
                    'telefono' => $tutorAcademicoTelefono,
                    'email' => $tutorAcademicoEmail,
                    'id_convocatoria_nivel' => $areaSeleccionada['id_convocatoria_nivel'],
                ];
                $tutorAcademico = TutorAcademico::create($tutorAcademicoData);

                // Crear inscripción
                $inscripcion = Inscripcion::create([
                    'id_estudiante' => $estudiante->id_estudiante,
                    'id_convocatoria_nivel' => $areaSeleccionada['id_convocatoria_nivel'],
                    'id_tutor_academico' => $tutorAcademico->id_tutor_academico,
                    'fecha_inscripcion' => now(),
                    'estado' => 'pendiente',
                ]);

                $inscripciones[] = $inscripcion;

                // Sumar el costo de inscripción al monto total
                $convocatoriaNivel = ConvocatoriaNivel::with('convocatoriaArea')->find($areaSeleccionada['id_convocatoria_nivel']);
                $montoTotal += $convocatoriaNivel->convocatoriaArea->costo_inscripcion;
            }

            // 5. Crear orden de pago
            $ordenPago = OrdenPago::create([
                'codigo_unico' => $request->codigo_unico,
                'tipo_origen' => 'individual',
                'id_inscripcion' => $inscripciones[0]->id_inscripcion, // Asociamos a la primera inscripción
                'id_lista' => null,
                'monto_total' => $montoTotal,
                'fecha_emision' => now(),
                'fecha_vencimiento' => now()->addDays(5), // 5 días para pagar
                'estado' => 'pendiente',
            ]);

            DB::commit();

            return $this->successResponse([
                'estudiante' => $estudiante,
                'inscripciones' => $inscripciones,
                'orden_pago' => $ordenPago,
            ], 'Inscripción completada correctamente', 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse('Error al procesar la inscripción: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Obtiene los datos necesarios para el formulario de inscripción
     */
    public function getDatosInscripcion()
    {
        // Obtener la convocatoria activa
        $convocatoria = Convocatoria::where('estado', 'abierta')
            ->where('fecha_inicio_inscripcion', '<=', now())
            ->where('fecha_fin_inscripcion', '>=', now())
            ->first();

        if (!$convocatoria) {
            return $this->errorResponse('No hay convocatorias abiertas actualmente', 404);
        }

        // Obtener los grados disponibles
        $grados = Grado::orderBy('orden')->get();

        return $this->successResponse([
            'convocatoria' => [
                'id' => $convocatoria->id_convocatoria,
                'nombre' => $convocatoria->nombre,
                'fecha_inicio' => $convocatoria->fecha_inicio_inscripcion,
                'fecha_fin' => $convocatoria->fecha_fin_inscripcion,
                'max_areas' => $convocatoria->max_areas_por_estudiante,
            ],
            'grados' => $grados->map(function ($grado) {
                return [
                    'id' => $grado->id_grado,
                    'nombre' => $grado->nombre_grado,
                ];
            }),
        ], 'Datos para inscripción obtenidos correctamente');
    }

    /**
     * Busca unidades educativas por nombre
     */
    public function buscarUnidadesEducativas(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'query' => 'required|string|min:3',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        $query = $request->query('query');
        $unidades = UnidadEducativa::where('nombre', 'like', "%{$query}%")
            ->limit(10)
            ->get()
            ->map(function ($unidad) {
                return [
                    'id' => $unidad->id_unidad_educativa,
                    'nombre' => $unidad->nombre,
                    'departamento' => $unidad->departamento,
                    'provincia' => $unidad->provincia,
                ];
            });

        return $this->successResponse($unidades, 'Unidades educativas encontradas');
    }
}