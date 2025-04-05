<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Convocatoria;
use App\Models\ConvocatoriaArea;
use App\Models\ConvocatoriaNivel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ConvocatoriaCompletaController extends ApiController
{
    /**
     * Crea una convocatoria completa con sus áreas y niveles en una sola operación
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function crearConvocatoriaCompleta(Request $request): JsonResponse
    {
        // Validar datos de entrada
        $validator = Validator::make($request->all(), [
            // Datos de la convocatoria
            'nombre' => 'required|string|max:100',
            'fecha_inicio_inscripcion' => 'required|date',
            'fecha_fin_inscripcion' => 'required|date|after_or_equal:fecha_inicio_inscripcion',
            'max_areas_por_estudiante' => 'required|integer|min:1',
            'estado' => 'required|in:planificada,abierta,cerrada,finalizada',
            
            // Áreas de la convocatoria
            'areas' => 'required|array|min:1',
            'areas.*.id_area' => 'required|exists:areas_competencia,id_area',
            'areas.*.costo_inscripcion' => 'required|numeric|min:0',
            
            // Niveles de la convocatoria
            'niveles' => 'required|array|min:1',
            'niveles.*.id_nivel' => 'required|exists:niveles_categoria,id_nivel',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        // Iniciar transacción
        DB::beginTransaction();
        
        try {
            // 1. Crear la convocatoria
            $convocatoria = Convocatoria::create([
                'nombre' => $request->input('nombre'),
                'fecha_inicio_inscripcion' => $request->input('fecha_inicio_inscripcion'),
                'fecha_fin_inscripcion' => $request->input('fecha_fin_inscripcion'),
                'max_areas_por_estudiante' => $request->input('max_areas_por_estudiante'),
                'estado' => $request->input('estado'),
            ]);
            
            // 2. Crear las áreas de la convocatoria
            $areas = [];
            foreach ($request->input('areas') as $areaData) {
                $area = ConvocatoriaArea::create([
                    'id_convocatoria' => $convocatoria->id_convocatoria,
                    'id_area' => $areaData['id_area'],
                    'costo_inscripcion' => $areaData['costo_inscripcion'],
                ]);
                $areas[] = $area;
            }
            
            // 3. Crear los niveles de la convocatoria
            $niveles = [];
            foreach ($request->input('niveles') as $nivelData) {
                $nivel = ConvocatoriaNivel::create([
                    'id_convocatoria' => $convocatoria->id_convocatoria,
                    'id_nivel' => $nivelData['id_nivel'],
                ]);
                $niveles[] = $nivel;
            }
            
            // Confirmar transacción
            DB::commit();
            
            // Cargar relaciones
            $convocatoria->load(['areas.area', 'niveles.nivel']);
            
            // Retornar respuesta exitosa
            return $this->successResponse([
                'convocatoria' => $convocatoria,
            ], 'Convocatoria creada correctamente con sus áreas y niveles', 201);
            
        } catch (\Exception $e) {
            // Revertir transacción en caso de error
            DB::rollBack();
            return $this->errorResponse('Error al crear la convocatoria: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Obtiene una convocatoria con todos sus datos relacionados
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function getConvocatoriaCompleta(int $id): JsonResponse
    {
        $convocatoria = Convocatoria::with([
            'areas.area',
            'niveles.nivel.gradoMin',
            'niveles.nivel.gradoMax',
            'niveles.nivel.area',
        ])->find($id);
        
        if (!$convocatoria) {
            return $this->errorResponse('Convocatoria no encontrada', 404);
        }
        
        // Agregar estadísticas
        $estadisticas = [
            'total_inscritos' => $this->getTotalInscritos($convocatoria->id_convocatoria),
            'ingresos_generados' => $this->getIngresosGenerados($convocatoria->id_convocatoria),
            'inscripciones_por_area' => $this->getInscripcionesPorArea($convocatoria->id_convocatoria),
        ];
        
        return $this->successResponse([
            'convocatoria' => $convocatoria,
            'estadisticas' => $estadisticas,
        ], 'Convocatoria obtenida correctamente');
    }
    
    /**
     * Calcula el total de estudiantes inscritos en una convocatoria
     */
    private function getTotalInscritos(int $convocatoriaId): int
    {
        return Inscripcion::whereHas('convocatoriaArea', function($query) use ($convocatoriaId) {
            $query->where('id_convocatoria', $convocatoriaId);
        })->count();
    }
    
    /**
     * Calcula los ingresos generados por una convocatoria
     */
    private function getIngresosGenerados(int $convocatoriaId): float
    {
        return OrdenPago::whereHas('inscripcion.convocatoriaArea', function($query) use ($convocatoriaId) {
            $query->where('id_convocatoria', $convocatoriaId);
        })->where('estado', 'pagada')->sum('monto_total');
    }
    
    /**
     * Obtiene estadísticas de inscripciones por área
     */
    private function getInscripcionesPorArea(int $convocatoriaId): array
    {
        return DB::table('inscripciones')
            ->join('convocatoria_areas', 'inscripciones.id_convocatoria_area', '=', 'convocatoria_areas.id_convocatoria_area')
            ->join('areas_competencia', 'convocatoria_areas.id_area', '=', 'areas_competencia.id_area')
            ->where('convocatoria_areas.id_convocatoria', $convocatoriaId)
            ->select('areas_competencia.nombre_area', DB::raw('count(*) as total'))
            ->groupBy('areas_competencia.nombre_area')
            ->get()
            ->toArray();
    }
}
