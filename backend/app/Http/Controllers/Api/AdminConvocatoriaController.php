<?php

namespace App\Http\Controllers\Api;

use App\Models\AreaCompetencia;
use App\Models\Convocatoria;
use App\Models\ConvocatoriaArea;
use App\Models\ConvocatoriaNivel;
use App\Models\NivelCategoria;
use App\Models\Grado;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class AdminConvocatoriaController extends ApiController
{
    /**
     * Obtiene todas las convocatorias activas
     * 
     * @return JsonResponse
     */
    public function getConvocatoriasActivas(): JsonResponse
    {
        $convocatorias = Convocatoria::whereIn('estado', ['planificada', 'abierta'])
            ->with(['areas.area'])
            ->get();

        return $this->successResponse(
            $convocatorias,
            'Convocatorias activas obtenidas correctamente'
        );
    }

     /**
     * Obtiene todas las convocatorias solo planificadas
     * 
     * @return JsonResponse
     */
    public function getConvocatoriasPlanificadas(): JsonResponse
    {
        $convocatorias = Convocatoria::whereIn('estado', ['planificada'])
            ->with(['areas.area'])
            ->get();

        return $this->successResponse(
            $convocatorias,
            'Convocatorias activas obtenidas correctamente'
        );
    }
    /**
     * Obtiene todas las áreas de competencia
     * 
     * @return JsonResponse
     */
    public function getAreasCompetencia(): JsonResponse
    {
        $areas = AreaCompetencia::all();

        return $this->successResponse(
            $areas,
            'Áreas de competencia obtenidas correctamente'
        );
    }

    /**
     * Obtiene todos los niveles de categoría
     * 
     * @return JsonResponse
     */
    public function getNivelesCategoria(): JsonResponse
    {
        $niveles = NivelCategoria::all();

        return $this->successResponse(
            $niveles,
            'Niveles de categoría obtenidos correctamente'
        );
    }

    /**
     * Obtiene todos los grados
     * 
     * @return JsonResponse
     */
    public function getGrados(): JsonResponse
    {
        $grados = Grado::orderBy('orden')->get();

        return $this->successResponse(
            $grados,
            'Grados obtenidos correctamente'
        );
    }

    /**
     * Crea una nueva convocatoria
     * 
     * @param Request $request
     * @return JsonResponse
     */    public function crearConvocatoria(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:100',
            'fecha_inicio_inscripcion' => 'required|date',
            'fecha_fin_inscripcion' => 'required|date|after_or_equal:fecha_inicio_inscripcion',
            'max_areas_por_estudiante' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        try {
            // Forzar estado inicial como "planificada"
            $datosConvocatoria = $request->all();
            $datosConvocatoria['estado'] = 'planificada';
            
            $convocatoria = Convocatoria::create($datosConvocatoria);
            
            // Verificar que la convocatoria se haya creado y tenga un ID
            if (!$convocatoria || !$convocatoria->id_convocatoria) {
                throw new \Exception('No se pudo crear la convocatoria correctamente');
            }
            
            return $this->successResponse(
                [
                    'id_convocatoria' => $convocatoria->id_convocatoria,
                    'nombre' => $convocatoria->nombre,
                    'estado' => $convocatoria->estado,
                    'fecha_inicio_inscripcion' => $convocatoria->fecha_inicio_inscripcion,
                    'fecha_fin_inscripcion' => $convocatoria->fecha_fin_inscripcion
                ],
                'Convocatoria creada correctamente',
                201
            );
        } catch (\Exception $e) {
            return $this->errorResponse('Error al crear la convocatoria: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Asocia áreas a una convocatoria (sin niveles, solo áreas)
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function asociarAreas(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id_convocatoria' => 'required|exists:convocatorias,id_convocatoria',
            'areas' => 'required|array|min:1',
            'areas.*.id_area' => 'required|exists:areas_competencia,id_area',
            'areas.*.costo_inscripcion' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        DB::beginTransaction();

        try {
            $idConvocatoria = $request->id_convocatoria;
            
            // Procesamos las áreas
            foreach ($request->input('areas') as $areaData) {
                $id_area = $areaData['id_area'];
                
                // Verificar si ya existe esta área para esta convocatoria
                $existingArea = ConvocatoriaArea::where('id_convocatoria', $idConvocatoria)
                    ->where('id_area', $id_area)
                    ->first();
                    
                if ($existingArea) {
                    // Actualizar el costo si ya existe
                    $existingArea->update([
                        'costo_inscripcion' => $areaData['costo_inscripcion']
                    ]);
                } else {
                    // Crear nueva área
                    ConvocatoriaArea::create([
                        'id_convocatoria' => $idConvocatoria,
                        'id_area' => $id_area,
                        'costo_inscripcion' => $areaData['costo_inscripcion'],
                    ]);
                }
            }

            DB::commit();

            // Obtener la convocatoria actualizada con relaciones
            $convocatoria = Convocatoria::with([
                'areas.area'
            ])->find($idConvocatoria);

            return $this->successResponse(
                $convocatoria,
                'Áreas asociadas correctamente',
                200
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse('Error al asociar áreas: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Asocia niveles y grados a las áreas de una convocatoria
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function asociarNivelesGrados(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id_convocatoria' => 'required|exists:convocatorias,id_convocatoria',
            'niveles' => 'required|array|min:1',
            'niveles.*.id_nivel' => 'required|exists:niveles_categoria,id_nivel',
            'niveles.*.id_area' => 'required|exists:areas_competencia,id_area',
            'niveles.*.id_grado_min' => 'required|exists:grados,id_grado',
            'niveles.*.id_grado_max' => 'required|exists:grados,id_grado',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        DB::beginTransaction();

        try {
            $idConvocatoria = $request->id_convocatoria;
            
            // Procesamos los niveles
            foreach ($request->input('niveles') as $nivelData) {
                // Obtenemos el área de convocatoria asociada
                $convocatoriaArea = ConvocatoriaArea::where('id_convocatoria', $idConvocatoria)
                    ->where('id_area', $nivelData['id_area'])
                    ->first();
                
                if (!$convocatoriaArea) {
                    throw new \Exception("El área con ID {$nivelData['id_area']} no está asociada a esta convocatoria");
                }
                
                $id_convocatoria_area = $convocatoriaArea->id_convocatoria_area;
                $id_nivel = $nivelData['id_nivel'];
                
                // Verificar si ya existe este nivel para esta área
                $existingNivel = ConvocatoriaNivel::where('id_convocatoria_area', $id_convocatoria_area)
                    ->where('id_nivel', $id_nivel)
                    ->first();
                    
                // Validar que el grado mínimo no sea mayor que el máximo
                if ($nivelData['id_grado_min'] > $nivelData['id_grado_max']) {
                    throw new \Exception('El grado mínimo no puede ser mayor que el grado máximo');
                }
                
                if ($existingNivel) {
                    // Actualizar si ya existe
                    $existingNivel->update([
                        'id_grado_min' => $nivelData['id_grado_min'],
                        'id_grado_max' => $nivelData['id_grado_max'],
                    ]);
                } else {
                    // Crear nuevo nivel
                    ConvocatoriaNivel::create([
                        'id_convocatoria_area' => $id_convocatoria_area,
                        'id_nivel' => $id_nivel,
                        'id_grado_min' => $nivelData['id_grado_min'],
                        'id_grado_max' => $nivelData['id_grado_max'],
                    ]);
                }
            }

            DB::commit();

            return $this->successResponse(
                [],
                'Niveles y grados configurados correctamente',
                200
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse('Error al configurar niveles y grados: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Obtiene las áreas asociadas a una convocatoria específica
     * 
     * @param int $id ID de la convocatoria
     * @return JsonResponse
     */
    public function getAreasPorConvocatoria(int $id): JsonResponse
    {
        try {
            // Verificar que la convocatoria exista
            $convocatoria = Convocatoria::findOrFail($id);
            
            // Obtener las áreas de la convocatoria con información completa
            $areas = ConvocatoriaArea::where('id_convocatoria', $id)
                ->with('area')
                ->get()
                ->map(function($convocatoriaArea) {
                    return [
                        'id_convocatoria_area' => $convocatoriaArea->id_convocatoria_area,
                        'id_area' => $convocatoriaArea->id_area,
                        'nombre_area' => $convocatoriaArea->area->nombre_area,
                        'costo_inscripcion' => $convocatoriaArea->costo_inscripcion,
                    ];
                });
            
            return $this->successResponse(
                $areas,
                'Áreas de la convocatoria obtenidas correctamente'
            );
        } catch (\Exception $e) {
            return $this->errorResponse('Error al obtener áreas de la convocatoria: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Obtiene los niveles ya asociados a las áreas de una convocatoria
     * 
     * @param int $id ID de la convocatoria
     * @return JsonResponse
     */
    public function getNivelesPorConvocatoria(int $id): JsonResponse
    {
        try {
            // Verificar que la convocatoria exista
            $convocatoria = Convocatoria::findOrFail($id);
            
            // Obtener las áreas de la convocatoria
            $areasConvocatoria = ConvocatoriaArea::where('id_convocatoria', $id)->get();
            $idAreasConvocatoria = $areasConvocatoria->pluck('id_convocatoria_area')->toArray();
            
            // Obtener los niveles asignados a esas áreas
            $nivelesAsignados = ConvocatoriaNivel::whereIn('id_convocatoria_area', $idAreasConvocatoria)
                ->with(['nivel', 'convocatoriaArea.area', 'gradoMinimo', 'gradoMaximo'])
                ->get()
                ->map(function($convocatoriaNivel) {
                    return [
                        'id_convocatoria_nivel' => $convocatoriaNivel->id_convocatoria_nivel,
                        'id_convocatoria_area' => $convocatoriaNivel->id_convocatoria_area,
                        'id_area' => $convocatoriaNivel->convocatoriaArea->id_area,
                        'nombre_area' => $convocatoriaNivel->convocatoriaArea->area->nombre_area,
                        'id_nivel' => $convocatoriaNivel->id_nivel,
                        'nombre_nivel' => $convocatoriaNivel->nivel->nombre_nivel,
                        'id_grado_min' => $convocatoriaNivel->id_grado_min,
                        'nombre_grado_min' => $convocatoriaNivel->gradoMinimo->nombre_grado,
                        'id_grado_max' => $convocatoriaNivel->id_grado_max,
                        'nombre_grado_max' => $convocatoriaNivel->gradoMaximo->nombre_grado,
                    ];
                });
            
            return $this->successResponse(
                $nivelesAsignados,
                'Niveles asignados a la convocatoria obtenidos correctamente'
            );
        } catch (\Exception $e) {
            return $this->errorResponse('Error al obtener niveles de la convocatoria: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Procesa las áreas para una convocatoria
     */
    private function procesarAreas(int $idConvocatoria, array $areas): void
    {
        foreach ($areas as $area) {
            $existente = ConvocatoriaArea::where('id_convocatoria', $idConvocatoria)
                ->where('id_area', $area['id_area'])
                ->first();

            if ($existente) {
                $existente->update([
                    'costo_inscripcion' => $area['costo_inscripcion']
                ]);
            } else {
                ConvocatoriaArea::create([
                    'id_convocatoria' => $idConvocatoria,
                    'id_area' => $area['id_area'],
                    'costo_inscripcion' => $area['costo_inscripcion'],
                ]);
            }
        }
    }

    /**
     * Procesa los niveles para una convocatoria
     */
    private function procesarNiveles(int $idConvocatoria, array $niveles): void
    {
        foreach ($niveles as $nivel) {
            // Verificar que el área pertenezca a la convocatoria
            $area = ConvocatoriaArea::where('id_convocatoria_area', $nivel['id_convocatoria_area'])
                ->where('id_convocatoria', $idConvocatoria)
                ->first();

            if (!$area) {
                throw new \Exception('El área seleccionada no pertenece a esta convocatoria');
            }

            // Verificar si ya existe este nivel para esta área
            $existente = ConvocatoriaNivel::where('id_convocatoria_area', $nivel['id_convocatoria_area'])
                ->where('id_nivel', $nivel['id_nivel'])
                ->first();

            if (!$existente) {
                // Validar que el grado mínimo no sea mayor que el máximo
                if ($nivel['id_grado_min'] > $nivel['id_grado_max']) {
                    throw new \Exception('El grado mínimo no puede ser mayor que el grado máximo');
                }                ConvocatoriaNivel::create([
                    'id_convocatoria_area' => $nivel['id_convocatoria_area'],
                    'id_nivel' => $nivel['id_nivel'],
                    'id_grado_min' => $nivel['id_grado_min'],
                    'id_grado_max' => $nivel['id_grado_max'],
                ]);
            }
        }
    }

    /**
     * Obtiene el estado y requisitos de una convocatoria
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function getEstadoConvocatoria(int $id): JsonResponse
    {
        $convocatoria = Convocatoria::find($id);
        
        if (!$convocatoria) {
            return $this->errorResponse('Convocatoria no encontrada', 404);
        }

        $requisitos = $convocatoria->obtenerRequisitosApertura();
        $puedeAbrir = $convocatoria->puedeAbrirse();
        $debeCerrar = $convocatoria->debeSerCerrada();

        return $this->successResponse([
            'estado_actual' => $convocatoria->estado,
            'puede_abrir' => $puedeAbrir,
            'debe_cerrar' => $debeCerrar,
            'requisitos' => $requisitos,
            'transiciones_validas' => $this->getTransicionesValidas($convocatoria->estado)
        ], 'Estado de convocatoria obtenido correctamente');
    }

    /**
     * Transiciona el estado de una convocatoria
     * 
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function transicionarEstado(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nuevo_estado' => 'required|in:planificada,abierta,cerrada,finalizada'
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        $convocatoria = Convocatoria::find($id);
        
        if (!$convocatoria) {
            return $this->errorResponse('Convocatoria no encontrada', 404);
        }

        $resultado = $convocatoria->transicionarEstado($request->nuevo_estado);

        if ($resultado['success']) {
            return $this->successResponse([
                'id_convocatoria' => $convocatoria->id_convocatoria,
                'estado_nuevo' => $convocatoria->estado
            ], $resultado['message']);
        } else {
            return $this->errorResponse(
                $resultado['message'], 
                422, 
                $resultado['requisitos_faltantes'] ?? null
            );
        }
    }

    /**
     * Cierra automáticamente convocatorias expiradas
     * 
     * @return JsonResponse
     */
    public function cerrarConvocatoriasExpiradas(): JsonResponse
    {
        $convocatorias = Convocatoria::paraCerrarAutomaticamente()->get();
        $cerradas = 0;

        foreach ($convocatorias as $convocatoria) {
            $resultado = $convocatoria->transicionarEstado('cerrada');
            if ($resultado['success']) {
                $cerradas++;
            }
        }

        return $this->successResponse([
            'convocatorias_cerradas' => $cerradas,
            'total_verificadas' => $convocatorias->count()
        ], "Se cerraron {$cerradas} convocatorias expiradas");
    }

    /**
     * Obtiene las transiciones válidas para un estado
     */    private function getTransicionesValidas(string $estado): array
    {
        $transiciones = [
            'planificada' => [
                ['estado' => 'abierta', 'label' => 'Abrir Convocatoria', 'requiere_validacion' => true]
            ],
            'abierta' => [
                // No hay transiciones manuales desde abierta
                // El cierre es automático cuando pasa la fecha
            ],
            'cerrada' => [
                ['estado' => 'finalizada', 'label' => 'Finalizar Convocatoria', 'requiere_validacion' => false]
            ],
            'finalizada' => []
        ];

        return $transiciones[$estado] ?? [];
    }

    /**
     * Obtiene todas las convocatorias (todos los estados)
     * 
     * @return JsonResponse
     */
    public function getAllConvocatorias(): JsonResponse
    {
        $convocatorias = Convocatoria::with(['areas.area'])
            ->orderBy('created_at', 'desc')
            ->get();

        return $this->successResponse(
            $convocatorias,
            'Todas las convocatorias obtenidas correctamente'
        );
    }
}
