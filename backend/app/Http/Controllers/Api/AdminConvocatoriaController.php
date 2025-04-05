<?php

namespace App\Http\Controllers\Api;

use App\Models\AreaCompetencia;
use App\Models\Convocatoria;
use App\Models\ConvocatoriaArea;
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
     * Crea una nueva convocatoria
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function crearConvocatoria(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:100',
            'fecha_inicio_inscripcion' => 'required|date',
            'fecha_fin_inscripcion' => 'required|date|after_or_equal:fecha_inicio_inscripcion',
            'max_areas_por_estudiante' => 'required|integer|min:1',
            'estado' => 'required|in:planificada,abierta,cerrada,finalizada',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        $convocatoria = Convocatoria::create($request->all());
        
        return $this->successResponse(
            $convocatoria,
            'Convocatoria creada correctamente',
            201
        );
    }
    
    /**
     * Asocia áreas a una convocatoria
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
            'areas.*.costo_inscripcion' => 'required|integer|min:1', // Cambiado a integer positivo
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        DB::beginTransaction();
        
        try {
            foreach ($request->input('areas') as $area) {
                // Verificar si ya existe la asociación
                $existente = ConvocatoriaArea::where('id_convocatoria', $request->id_convocatoria)
                    ->where('id_area', $area['id_area'])
                    ->first();
                
                if ($existente) {
                    // Actualizar el costo si existe
                    $existente->update([
                        'costo_inscripcion' => $area['costo_inscripcion']
                    ]);
                } else {
                    // Crear nueva asociación
                    ConvocatoriaArea::create([
                        'id_convocatoria' => $request->id_convocatoria,
                        'id_area' => $area['id_area'],
                        'costo_inscripcion' => $area['costo_inscripcion'],
                    ]);
                }
            }
            
            DB::commit();
            
            // Obtener la convocatoria con las áreas asociadas
            $convocatoria = Convocatoria::with(['areas.area'])
                ->find($request->id_convocatoria);
            
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
}
