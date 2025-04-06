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

        try {
            $convocatoria = Convocatoria::create($request->all());
            
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
     * Asocia áreas y niveles a una convocatoria
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
            'areas.*.costo_inscripcion' => 'required|numeric|min:0',
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
            $areasMap = []; // Para mapear id_area a id_convocatoria_area
            
            // 1. Primero procesamos las áreas y guardamos una referencia
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
                    $areasMap[$id_area] = $existingArea->id_convocatoria_area;
                } else {
                    // Crear nueva área
                    $newArea = ConvocatoriaArea::create([
                        'id_convocatoria' => $idConvocatoria,
                        'id_area' => $id_area,
                        'costo_inscripcion' => $areaData['costo_inscripcion'],
                    ]);
                    $areasMap[$id_area] = $newArea->id_convocatoria_area;
                }
            }
            
            // 2. Ahora procesamos los niveles usando el mapa de áreas
            foreach ($request->input('niveles') as $nivelData) {
                $id_area = $nivelData['id_area'];
                $id_nivel = $nivelData['id_nivel'];
                
                // Verificar que el área fue creada correctamente
                if (!isset($areasMap[$id_area])) {
                    throw new \Exception("No se encontró el área con ID {$id_area} para esta convocatoria");
                }
                
                $id_convocatoria_area = $areasMap[$id_area];
                
                // Verificar si ya existe este nivel para esta área
                $existingNivel = ConvocatoriaNivel::where('id_convocatoria_area', $id_convocatoria_area)
                    ->where('id_nivel', $id_nivel)
                    ->first();
                    
                if (!$existingNivel) {
                    // Validar que el grado mínimo no sea mayor que el máximo
                    if ($nivelData['id_grado_min'] > $nivelData['id_grado_max']) {
                        throw new \Exception('El grado mínimo no puede ser mayor que el grado máximo');
                    }
                    
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

            // Obtener la convocatoria actualizada con relaciones
            $convocatoria = Convocatoria::with([
                'areas.area', 
                'niveles.nivel',
                'niveles.gradoMin',
                'niveles.gradoMax'
            ])->find($idConvocatoria);

            return $this->successResponse(
                $convocatoria,
                'Áreas y niveles asociados correctamente',
                200
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse('Error al asociar áreas y niveles: ' . $e->getMessage(), 500);
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
                }

                ConvocatoriaNivel::create([
                    'id_convocatoria_area' => $nivel['id_convocatoria_area'],
                    'id_nivel' => $nivel['id_nivel'],
                    'id_grado_min' => $nivel['id_grado_min'],
                    'id_grado_max' => $nivel['id_grado_max'],
                ]);
            }
        }
    }
}
