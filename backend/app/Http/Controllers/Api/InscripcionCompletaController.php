<?php

namespace App\Http\Controllers\Api;

use App\Models\Grado;
use App\Models\OrdenPago;
use App\Models\Estudiante;
use App\Models\TutorLegal;
use App\Models\Inscripcion;
use Illuminate\Support\Str;
use App\Models\Convocatoria;
use App\Models\ConvocatoriaArea;
use App\Models\AreaCompetencia;
use Illuminate\Http\Request;
use App\Models\TutorAcademico;
use App\Models\UnidadEducativa;
use App\Models\ListaInscripcion;
use App\Models\EncargadoPago;
use App\Models\ConvocatoriaNivel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Models\DetalleListaInscripcion;
use Illuminate\Support\Facades\Validator;
use App\Mail\CodigoUnicoPago;

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

    public function estudianteEstaInscrito(Request $request){
        $validator = Validator::make($request->all(), [
            'lista_inscripcion' => 'required|array',
            'id_convocatoria' => 'required|string',
        ]);
        $convocatoria = Convocatoria::find($request->id_convocatoria);
        if (!$convocatoria || $convocatoria->estado !== 'abierta') {
            return $this->errorResponse('La convocatoria no está abierta para inscripciones', 422);
        }
        $inscripciones = $request->lista_inscripcion;
        $idConvocatoria = $request->id_convocatoria;
        $erroresInscripcion = [];
        foreach ($inscripciones as $index => $inscripcionData) {
            $validatorInscripcion = Validator::make($inscripcionData, [
                // Datos del estudiante
                'nombres' => 'required|string|max:100',
                'apellidos' => 'required|string|max:100',
                'ci' => 'required|string|max:20',
                'id_grado' => 'required|exists:grados,id_grado',

                // Datos de la convocatoria y áreas seleccionadas
                'areas_seleccionadas' => 'required|array|min:1',
                'areas_seleccionadas.*.id_convocatoria_nivel' => 'required|exists:convocatoria_niveles,id_convocatoria_nivel',
            ]);
    
            if ($validatorInscripcion->fails()) {
                $erroresInscripcion[$inscripcionData['ci']] = $validatorInscripcion->errors()->first();
                continue; // Si la validación básica falla, no continuamos con las otras verificaciones para este estudiante
            }
        
            $maxAreasPermitidas = $convocatoria->max_areas_por_estudiante;

            // 1. Contar cuántas áreas está intentando seleccionar en esta inscripción
            $areasSeleccionadas = isset($inscripcionData['areas_seleccionadas']) ? count($inscripcionData['areas_seleccionadas']) : 0;

            // 2. Obtener al estudiante por CI
            $estudiante = Estudiante::where('ci', $inscripcionData['ci'])->first();

            

            $numInscripcionesPrevias = 0;

            if ($estudiante) {
                $id_estudiante = $estudiante->id_estudiante;

                // Obtener todas las áreas de la convocatoria
                $areasHabilitadas = ConvocatoriaArea::where('id_convocatoria', $idConvocatoria)->pluck('id_convocatoria_area');

                // Obtener todos los niveles de esas áreas
                $nivelesHabilitados = ConvocatoriaNivel::whereIn('id_convocatoria_area', $areasHabilitadas)->pluck('id_convocatoria_nivel');

                // Contar inscripciones previas en esta convocatoria
                $numInscripcionesPrevias = DetalleListaInscripcion::where('id_estudiante', $id_estudiante)
                    ->whereIn('id_convocatoria_nivel', $nivelesHabilitados)
                    ->count();
            }

            // 3. Validar el total de inscripciones (actuales + anteriores)
            $totalInscripciones = $areasSeleccionadas + $numInscripcionesPrevias;

            if ($totalInscripciones > $maxAreasPermitidas) {
                $erroresInscripcion[$inscripcionData['ci']] = "El estudiante con CI {$inscripcionData['ci']} ya tiene {$numInscripcionesPrevias} inscripción(es) previa(s) y está intentando registrar {$areasSeleccionadas} más, excediendo el máximo de $maxAreasPermitidas área(s) permitida(s).";
                continue;
            }

            if($numInscripcionesPrevias>0){
                if($estudiante->id_grado != $inscripcionData['id_grado']){
                    $erroresInscripcion[$inscripcionData['ci']] = "No puede registrar al estudiante con CI {$inscripcionData['ci']} con un distinto Grado en la misma convocatoria";
                }
            }

    
            $areasInscritas = [];
            foreach ($inscripcionData['areas_seleccionadas'] as $areaSeleccionada) {
                $idConvocatoriaNivel = $areaSeleccionada['id_convocatoria_nivel'];
    
                // 3. Verificar si el estudiante ya está inscrito en este nivel de competencia
                if ($this->estaInscritoArea($inscripcionData['ci'], $idConvocatoriaNivel)) {
                    $nombreArea = $this->getNombreArea($idConvocatoriaNivel);
                    $erroresInscripcion[$inscripcionData['ci']] = "El estudiante con CI {$inscripcionData['ci']} ya está inscrito en el área '{$nombreArea}'.";
                    continue 2; // Salir del bucle de áreas para este estudiante
                }
    
                $areasInscritas[] = $idConvocatoriaNivel;
            }
        }
    
        // Si hay errores en la verificación previa, los devolvemos sin iniciar la transacción
        if (!empty($erroresInscripcion)) {
            return $this->errorResponse('No se pudieron inscribir algunos estudiantes debido a los siguientes errores:', 422, $erroresInscripcion);
        }

        return $this->successResponse(null, 'Todos los estudiantes pueden ser inscritos sin problemas de duplicidad o límites de áreas.', 200);
    }
    
    public function inscribirEstudiante(Request $request)
    {
        Log::info(__FUNCTION__);
        $validator = Validator::make($request->all(), [
            'lista_inscripcion' => 'required|array',
            'id_convocatoria' => 'required|string',
            'codigo_unico' => 'required|string',
            'encargado_pago' => 'required|array'
        ]);
    
        Log::info("esto nos llega" . json_encode($request->all()));
        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }
    
        $convocatoria = Convocatoria::find($request->id_convocatoria);
        if (!$convocatoria || $convocatoria->estado !== 'abierta') {
            return $this->errorResponse('La convocatoria no está abierta para inscripciones', 422);
        }
    
        $montoTotal = 0;
        $inscripciones = $request->lista_inscripcion;
        $erroresInscripcion = []; // Array para almacenar errores por estudiante
    
        foreach ($inscripciones as $index => $inscripcionData) {
            Log::info("Datos de unidad_educativa antes de validar: " . json_encode($inscripcionData['unidad_educativa']));
            Log::info("inscripcion " . json_encode($inscripcionData) . "  " . gettype($inscripcionData));
            $validatorInscripcion = Validator::make($inscripcionData, [
                // Datos del estudiante
                'nombres' => 'required|string|max:100',
                'apellidos' => 'required|string|max:100',
                'ci' => 'required|string|max:20',
                'genero' => 'nullable|string|max:20',
                'fecha_nacimiento' => 'nullable|required|date',
                'email' => 'nullable|email|max:100',
                'id_grado' => 'required|exists:grados,id_grado',
                'telefono' => 'nullable|string|max:20',
    
                // Datos de la unidad educativa
                'unidad_educativa' => 'required|array',
                'unidad_educativa.id_unidad_educativa' => 'nullable|exists:unidades_educativas,id_unidad_educativa',
                'unidad_educativa.nombre' => 'nullable|required_without:unidad_educativa.id_unidad_educativa|string|max:200',
                'unidad_educativa.departamento' => 'nullable|string|max:50',
                'unidad_educativa.provincia' => 'nullable|string|max:50',
    
                // Datos del tutor legal
                'tutor_legal' => 'required|array',
                'tutor_legal.nombres' => 'required|string|max:100',
                'tutor_legal.apellidos' => 'required|string|max:100',
                'tutor_legal.ci' => 'required|string|max:20',
                'tutor_legal.telefono' => 'nullable|string|max:20',
                'tutor_legal.email' => 'nullable|email|max:100',
                'tutor_legal.parentesco' => 'nullable|string|max:50',
                'tutor_legal.es_el_mismo_estudiante' => 'required|boolean',
    
                // Datos de la convocatoria y áreas seleccionadas
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
    
                //Datos de encargados de pago (se validarán a nivel de la solicitud principal)
            ]);
    
            if ($validatorInscripcion->fails()) {
                $erroresInscripcion[$inscripcionData['ci']] = $validatorInscripcion->errors()->first();
                continue; // Si la validación básica falla, no continuamos con las otras verificaciones para este estudiante
            }
        
            // 1. Verificar el máximo de áreas permitidas por estudiante
            if (count($inscripcionData['areas_seleccionadas']) > $convocatoria->max_areas_por_estudiante) {
                $erroresInscripcion[$inscripcionData['ci']] = "Se ha excedido el máximo de áreas permitidas ({$convocatoria->max_areas_por_estudiante}) para este estudiante.";
                continue;
            }
    
            $areasInscritas = [];
            foreach ($inscripcionData['areas_seleccionadas'] as $areaSeleccionada) {
                $idConvocatoriaNivel = $areaSeleccionada['id_convocatoria_nivel'];
    
                // 2. Verificar si el estudiante ya está inscrito en este nivel de competencia
                if ($this->estaInscritoArea($inscripcionData['ci'], $idConvocatoriaNivel)) {
                    $nombreArea = $this->getNombreArea($idConvocatoriaNivel);
                    $erroresInscripcion[$inscripcionData['ci']] = "El estudiante con CI {$inscripcionData['ci']} ya está inscrito en el área '{$nombreArea}'.";
                    continue 2; // Salir del bucle de áreas para este estudiante
                }
    
                $areasInscritas[] = $idConvocatoriaNivel;
            }
            // Fin de las nuevas verificaciones para cada estudiante
        }
    
        // Si hay errores en la verificación previa, los devolvemos sin iniciar la transacción
        if (!empty($erroresInscripcion)) {
            return $this->errorResponse('No se pudieron inscribir algunos estudiantes debido a los siguientes errores:', 422, $erroresInscripcion);
        }

        $listaInscripcion = ListaInscripcion::create([
            'codigo_lista' => null,
            'id_unidad_educativa' => null,
            'fecha_creacion' => now()
        ]);
    
        // Si no hay errores, iniciamos la transacción para realizar las inscripciones
        DB::beginTransaction();
    
        try {
            foreach ($inscripciones as $inscripcionData) {
                // 1. Crear o actualizar unidad educativa
                $idUnidadEducativa = null;

                if (isset($inscripcionData['unidad_educativa']['id_unidad_educativa'])) {
                    $idUnidadEducativa = $inscripcionData['unidad_educativa']['id_unidad_educativa'];
                } else {
                    $unidadEducativaDepartamento = $inscripcionData['unidad_educativa']['departamento'] ?? '';
                    $unidadEducativaProvincia = $inscripcionData['unidad_educativa']['provincia'] ?? '';
                    $unidadEducativaNombre = $inscripcionData['unidad_educativa']['nombre'] ?? '';

                    $departamentoParaGuardar = $unidadEducativaDepartamento !== "" ? $unidadEducativaDepartamento : 'No Especificado';
                    $provinciaParaGuardar = $unidadEducativaProvincia !== "" ? $unidadEducativaProvincia : 'No Especificado';
                    $nombreParaGuardar = $unidadEducativaNombre !== "" ? $unidadEducativaNombre : 'Colegio Desconocido';

                    $unidadEducativa = UnidadEducativa::where('nombre', $nombreParaGuardar)
                        ->where('departamento', $departamentoParaGuardar)
                        ->where('provincia', $provinciaParaGuardar)
                        ->first();

                    if ($unidadEducativa) {
                        // Ya existe, actualizar por si hay cambios
                        $unidadEducativa->update([
                            'nombre' => $nombreParaGuardar,
                            'departamento' => $departamentoParaGuardar,
                            'provincia' => $provinciaParaGuardar,
                        ]);
                    } else {
                        // No existe, crear nueva
                        $unidadEducativa = UnidadEducativa::create([
                            'nombre' => $nombreParaGuardar,
                            'departamento' => $departamentoParaGuardar,
                            'provincia' => $provinciaParaGuardar,
                        ]);
                    }

                    $idUnidadEducativa = $unidadEducativa->id_unidad_educativa;
                }
    
                // 2. Crear tutor legal
                $tutorLegalEmail = $inscripcionData['tutor_legal']['email'] ?? 'tutor.sin.email@miinstitucion.edu.bo';
                $tutorLegalTelefono = $inscripcionData['tutor_legal']['telefono'] ?? 'Sin Teléfono';
                $tutorLegalParentesco = $inscripcionData['tutor_legal']['parentesco'] ?? 'No Especificado';

                $tutorLegalData = [
                    'nombres' => $inscripcionData['tutor_legal']['nombres'],
                    'apellidos' => $inscripcionData['tutor_legal']['apellidos'],
                    'ci' => $inscripcionData['tutor_legal']['ci'],
                    'telefono' => $tutorLegalTelefono,
                    'email' => $tutorLegalEmail,
                    'parentesco' => $tutorLegalParentesco,
                    'es_el_mismo_estudiante' => $inscripcionData['tutor_legal']['es_el_mismo_estudiante'],
                ];

                // Buscar si ya existe un tutor legal con ese CI
                $tutorLegal = TutorLegal::where('ci', $inscripcionData['tutor_legal']['ci'])->first();

                if ($tutorLegal) {
                    // Ya existe, actualizar sus datos
                    $tutorLegal->update($tutorLegalData);
                } else {
                    // No existe, crear nuevo
                    $tutorLegal = TutorLegal::create($tutorLegalData);
                }
    
                // 3. Crear estudiante (misma lógica que antes)
                $estudianteEmail = $inscripcionData['email'] ?? 'estudiante.no.tiene.correo@miinstitucion.edu.bo';
                $estudianteDepartamento = $inscripcionData['departamento'] ?? 'No Especificado';
                $estudianteProvincia = $inscripcionData['provincia'] ?? 'No Especificado';
                $estudianteGenero = $inscripcionData['genero'] ?? 'No Especificado';
                $estudianteTelefono = $inscripcionData['telefono'] ?? 0;

                $estudianteData = [
                    'nombres' => $inscripcionData['nombres'],
                    'apellidos' => $inscripcionData['apellidos'],
                    'ci' => $inscripcionData['ci'],
                    'genero' => $estudianteGenero,
                    'fecha_nacimiento' => $inscripcionData['fecha_nacimiento'],
                    'id_unidad_educativa' => $idUnidadEducativa,
                    'id_grado' => $inscripcionData['id_grado'],
                    'id_tutor_legal' => $tutorLegal->id_tutor_legal,
                    'email' => $estudianteEmail,
                    'telefono' => $estudianteTelefono,
                    'departamento' => $estudianteDepartamento,
                    'provincia' => $estudianteProvincia,
                ];

                // Verificar si ya existe un estudiante con ese CI
                $estudiante = Estudiante::where('ci', $inscripcionData['ci'])->first();

                if ($estudiante) {
                    // Ya existe: actualiza los datos existentes
                    $estudiante->update($estudianteData);
                } else {
                    // No existe: crea uno nuevo
                    $estudiante = Estudiante::create($estudianteData);
                }

                // 4. Crear inscripciones y tutores académicos para cada área seleccionada
                foreach ($inscripcionData['areas_seleccionadas'] as $areaSeleccionada) {
                    $idConvocatoriaNivel = $areaSeleccionada['id_convocatoria_nivel'];
                    $tutorData = null;
                    if (isset($inscripcionData['tutores_academicos'])) {
                        foreach ($inscripcionData['tutores_academicos'] as $tutor) {
                            if (isset($tutor['id_convocatoria_nivel']) && $tutor['id_convocatoria_nivel'] == $idConvocatoriaNivel) {
                                $tutorData = $tutor;
                                break;
                            }
                        }
                    }
    
                    $tutorAcademicoNombres = $tutorData['nombres'] ?? 'Sin Nombre Asignado';
                    $tutorAcademicoApellidos = $tutorData['apellidos'] ?? 'Sin Apellido Asignado';
                    $tutorAcademicoCi = $tutorData['ci'] ?? 'SN';
                    $tutorAcademicoTelefono = $tutorData['telefono'] ?? 'No Registrado';
                    $tutorAcademicoEmail = $tutorData['email'] ?? 'tutoracademico.no.email@miinstitucion.edu.bo';

                    $tutorAcademicoData = [
                        'nombres' => $tutorAcademicoNombres,
                        'apellidos' => $tutorAcademicoApellidos,
                        'ci' => $tutorAcademicoCi,
                        'telefono' => $tutorAcademicoTelefono,
                        'email' => $tutorAcademicoEmail,
                    ];

                    // Buscar si ya existe un tutor académico con mismo CI y convocatoria
                    $tutorAcademico = TutorAcademico::where('ci', $tutorAcademicoCi)
                        ->first();

                    if ($tutorAcademico) {
                        $tutorAcademico->update($tutorAcademicoData);
                    } else {
                        $tutorAcademico = TutorAcademico::create($tutorAcademicoData);
                    }
    
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
    
            // 5. Crear orden de pago (misma lógica que antes)
            $ordenPago = OrdenPago::create([
                'codigo_unico' => $request->codigo_unico,
                'tipo_origen' => 'lista',
                'id_inscripcion' => null,
                'id_lista' => $listaInscripcion->id_lista,
                'monto_total' => $montoTotal,
                'fecha_emision' => now(),
                'fecha_vencimiento' => now()->addDays(5),
                'estado' => 'pendiente',
            ]);
    
            // 6. Crear el encargado de pago (misma lógica que antes)
            $encargadoPago = EncargadoPago::create([
                'id_lista' => $listaInscripcion->id_lista,
                'nombres' => $request->encargado_pago['nombres_encargado'],
                'apellidos' => $request->encargado_pago['apellidos_encargado'],
                'ci' => $request->encargado_pago['ci_encargado'],
                'email' => $request->encargado_pago['email_encargado'],
            ]);
    
            DB::commit();
    
            // 7. Enviar correo electrónico al encargado de pago (misma lógica que antes)
            Mail::to($encargadoPago->email)->send(new CodigoUnicoPago($request->codigo_unico, $encargadoPago->nombres));
    
            return $this->successResponse([
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

    public function getNombreArea($id_categoria_nivel){
        $id_convocatoria_area =  ConvocatoriaNivel::where('id_convocatoria_nivel', $id_categoria_nivel)
                                                ->value('id_convocatoria_area');
        $id_area = ConvocatoriaArea::where('id_convocatoria_area', $id_convocatoria_area)
                                ->value('id_area');
        $nom_area = AreaCompetencia::where('id_area', $id_area)
                                ->value('nombre_area');
        return $nom_area;
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
                'updated_at' => $convocatoria->updated_at,
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