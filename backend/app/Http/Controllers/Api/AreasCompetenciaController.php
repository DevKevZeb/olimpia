<?php

namespace App\Http\Controllers\Api;

use App\Models\AreaCompetencia;
use Illuminate\Http\Request;
use App\Http\Resources\AreaCompetenciaResource;
use App\Http\Resources\AreaCompetenciaCollection;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class AreasCompetenciaController extends ApiController
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $areas = AreaCompetencia::all();
        return $this->successResponse(
            new AreaCompetenciaCollection($areas),
            'Áreas de competencia obtenidas correctamente'
        );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nombre_area' => 'required|string|max:100|unique:areas_competencia',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        $area = AreaCompetencia::create($request->all());
        
        return $this->successResponse(
            new AreaCompetenciaResource($area),
            'Área de competencia creada correctamente',
            201
        );
    }

    /**
     * Display the specified resource.
     */
    public function show(int $id): JsonResponse
    {
        $area = AreaCompetencia::find($id);
        
        if (!$area) {
            return $this->errorResponse('Área de competencia no encontrada', 404);
        }
        
        return $this->successResponse(
            new AreaCompetenciaResource($area),
            'Área de competencia obtenida correctamente'
        );
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $area = AreaCompetencia::find($id);
        
        if (!$area) {
            return $this->errorResponse('Área de competencia no encontrada', 404);
        }
        
        $validator = Validator::make($request->all(), [
            'nombre_area' => 'required|string|max:100|unique:areas_competencia,nombre_area,' . $id . ',id_area',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        $area->update($request->all());
        
        return $this->successResponse(
            new AreaCompetenciaResource($area),
            'Área de competencia actualizada correctamente'
        );
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(int $id): JsonResponse
    {
        $area = AreaCompetencia::find($id);
        
        if (!$area) {
            return $this->errorResponse('Área de competencia no encontrada', 404);
        }
        
        $area->delete();
        
        return $this->successResponse(
            null,
            'Área de competencia eliminada correctamente'
        );
    }
}
