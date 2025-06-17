<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\CrearConvocatoriaRequest;
use App\Http\Requests\AsociarAreasRequest;
use App\Http\Requests\AsociarNivelesGradosRequest;
use App\Http\Requests\TransicionarEstadoRequest;
use App\Services\ConvocatoriaService;
use App\Services\ConvocatoriaConfiguracionService;
use App\Services\ConvocatoriaEstadoService;
use App\Services\DatosReferenciaService;
use Illuminate\Http\JsonResponse;

class AdminConvocatoriaControllerRefactored extends ApiController
{
    private $convocatoriaService;
    private $configuracionService;
    private $estadoService;
    private $datosReferenciaService;

    public function __construct(
        ConvocatoriaService $convocatoriaService,
        ConvocatoriaConfiguracionService $configuracionService,
        ConvocatoriaEstadoService $estadoService,
        DatosReferenciaService $datosReferenciaService
    ) {
        $this->convocatoriaService = $convocatoriaService;
        $this->configuracionService = $configuracionService;
        $this->estadoService = $estadoService;
        $this->datosReferenciaService = $datosReferenciaService;
    }

    /**
     * Obtiene todas las convocatorias activas
     * 
     * @return JsonResponse
     */
    public function getConvocatoriasActivas(): JsonResponse
    {
        $convocatorias = $this->convocatoriaService->obtenerActivas();

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
        $convocatorias = $this->convocatoriaService->obtenerPlanificadas();

        return $this->successResponse(
            $convocatorias,
            'Convocatorias planificadas obtenidas correctamente'
        );
    }

    /**
     * Obtiene todas las áreas de competencia
     * 
     * @return JsonResponse
     */
    public function getAreasCompetencia(): JsonResponse
    {
        $areas = $this->datosReferenciaService->obtenerAreasCompetencia();

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
        $niveles = $this->datosReferenciaService->obtenerNivelesCategoria();

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
        $grados = $this->datosReferenciaService->obtenerGrados();

        return $this->successResponse(
            $grados,
            'Grados obtenidos correctamente'
        );
    }

    /**
     * Crea una nueva convocatoria
     * 
     * @param CrearConvocatoriaRequest $request
     * @return JsonResponse
     */
    public function crearConvocatoria(CrearConvocatoriaRequest $request): JsonResponse
    {
        try {
            $convocatoria = $this->convocatoriaService->crearConvocatoria($request->validated());
            
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
     * @param AsociarAreasRequest $request
     * @return JsonResponse
     */
    public function asociarAreas(AsociarAreasRequest $request): JsonResponse
    {
        try {
            $convocatoria = $this->configuracionService->asociarAreas(
                $request->validated()['id_convocatoria'],
                $request->validated()['areas']
            );

            return $this->successResponse(
                $convocatoria,
                'Áreas asociadas correctamente',
                200
            );
        } catch (\Exception $e) {
            return $this->errorResponse('Error al asociar áreas: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Asocia niveles y grados a las áreas de una convocatoria
     * 
     * @param AsociarNivelesGradosRequest $request
     * @return JsonResponse
     */
    public function asociarNivelesGrados(AsociarNivelesGradosRequest $request): JsonResponse
    {
        try {
            $this->configuracionService->asociarNivelesGrados(
                $request->validated()['id_convocatoria'],
                $request->validated()['niveles']
            );

            return $this->successResponse(
                [],
                'Niveles y grados configurados correctamente',
                200
            );
        } catch (\Exception $e) {
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
            $this->convocatoriaService->encontrarPorIdOFallar($id);
            
            $areas = $this->configuracionService->obtenerAreasPorConvocatoria($id);
            
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
     * @param int $id_area ID del área (opcional)
     * @return JsonResponse
     */
    public function getNivelesPorConvocatoria(int $id, int $id_area = null): JsonResponse
    {
        try {
            // Verificar que la convocatoria exista
            $this->convocatoriaService->encontrarPorIdOFallar($id);
            
            $nivelesAsignados = $this->configuracionService->obtenerNivelesPorConvocatoria($id, $id_area);
            
            return $this->successResponse(
                $nivelesAsignados,
                'Niveles asignados a la convocatoria obtenidos correctamente'
            );
        } catch (\Exception $e) {
            return $this->errorResponse('Error al obtener niveles de la convocatoria: ' . $e->getMessage(), 500);
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
        try {
            $convocatoria = $this->convocatoriaService->encontrarPorIdOFallar($id);
            
            $estadoCompleto = $this->estadoService->obtenerEstadoCompleto($convocatoria);

            return $this->successResponse(
                $estadoCompleto,
                'Estado de convocatoria obtenido correctamente'
            );
        } catch (\Exception $e) {
            return $this->errorResponse('Error al obtener estado de convocatoria: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Transiciona el estado de una convocatoria
     * 
     * @param TransicionarEstadoRequest $request
     * @param int $id
     * @return JsonResponse
     */
    public function transicionarEstado(TransicionarEstadoRequest $request, int $id): JsonResponse
    {
        try {
            $convocatoria = $this->convocatoriaService->encontrarPorIdOFallar($id);
            
            $resultado = $this->estadoService->transicionarEstado(
                $convocatoria, 
                $request->validated()['nuevo_estado']
            );

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
        } catch (\Exception $e) {
            return $this->errorResponse('Error en transición de estado: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Cierra automáticamente convocatorias expiradas
     * 
     * @return JsonResponse
     */
    public function cerrarConvocatoriasExpiradas(): JsonResponse
    {
        try {
            $resultado = $this->estadoService->cerrarConvocatoriasExpiradas();

            return $this->successResponse(
                $resultado,
                "Se cerraron {$resultado['convocatorias_cerradas']} convocatorias expiradas"
            );
        } catch (\Exception $e) {
            return $this->errorResponse('Error al cerrar convocatorias expiradas: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Obtiene todas las convocatorias (todos los estados)
     * 
     * @return JsonResponse
     */
    public function getAllConvocatorias(): JsonResponse
    {
        $convocatorias = $this->convocatoriaService->obtenerTodas();

        return $this->successResponse(
            $convocatorias,
            'Todas las convocatorias obtenidas correctamente'
        );
    }
}
