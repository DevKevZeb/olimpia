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

        $convocatoria = Convocatoria::create($request->all());

        return $this->successResponse(
            $convocatoria,
            'Convocatoria creada correctamente',
            201
        );
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
            'areas.*.costo_inscripcion' => 'required|integer|min:1',
            'niveles' => 'required|array|min:1',
            'niveles.*.id_nivel' => 'required|exists:niveles_categoria,id_nivel',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        DB::beginTransaction();

        try {
            // Procesar áreas
            foreach ($request->input('areas') as $area) {
                $existente = ConvocatoriaArea::where('id_convocatoria', $request->id_convocatoria)
                    ->where('id_area', $area['id_area'])
                    ->first();

                if ($existente) {
                    $existente->update([
                        'costo_inscripcion' => $area['costo_inscripcion']
                    ]);
                } else {
                    ConvocatoriaArea::create([
                        'id_convocatoria' => $request->id_convocatoria,
                        'id_area' => $area['id_area'],
                        'costo_inscripcion' => $area['costo_inscripcion'],
                    ]);
                }
            }

            // Procesar niveles para cada área
            foreach ($request->input('niveles') as $nivel) {
                // Verificar que el nivel tenga el id_convocatoria_area
                if (!isset($nivel['id_convocatoria_area'])) {
                    throw new \Exception('Se requiere id_convocatoria_area para cada nivel');
                }

                // Verificar que el área pertenezca a la convocatoria
                $area = ConvocatoriaArea::where('id_convocatoria_area', $nivel['id_convocatoria_area'])
                    ->where('id_convocatoria', $request->id_convocatoria)
                    ->first();

                if (!$area) {
                    throw new \Exception('El área seleccionada no pertenece a esta convocatoria');
                }

                // Verificar si ya existe este nivel para esta área
                $existente = ConvocatoriaNivel::where('id_convocatoria_area', $nivel['id_convocatoria_area'])
                    ->where('id_nivel', $nivel['id_nivel'])
                    ->first();

                if (!$existente) {
                    // Validar que existan los grados mínimo y máximo
                    if (!isset($nivel['id_grado_min']) || !isset($nivel['id_grado_max'])) {
                        throw new \Exception('Se requieren grados mínimo y máximo para cada nivel');
                    }

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

            DB::commit();

            // Obtener la convocatoria con las áreas y niveles asociados
            $convocatoria = Convocatoria::with(['areas.area', 'niveles.nivel'])
                ->find($request->id_convocatoria);

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
}
