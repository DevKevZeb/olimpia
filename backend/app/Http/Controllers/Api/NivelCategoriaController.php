<?php

namespace App\Http\Controllers\Api;

use App\Models\NivelCategoria;
use Illuminate\Http\Request;
use App\Http\Resources\NivelCategoriaResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class NivelCategoriaController extends ApiController
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $niveles = NivelCategoria::with(['area', 'gradoMin', 'gradoMax'])->get();
        return $this->successResponse(
            NivelCategoriaResource::collection($niveles),
            'Niveles obtenidos correctamente'
        );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nombre_nivel' => 'required|string|max:100',
            'id_area' => 'required|exists:areas_competencia,id_area',
            'id_grado_min' => 'required|exists:grados,id_grado',
            'id_grado_max' => 'required|exists:grados,id_grado|gte:id_grado_min',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        // Check unique constraint (area, nombre_nivel)
        $exists = NivelCategoria::where('id_area', $request->id_area)
            ->where('nombre_nivel', $request->nombre_nivel)
            ->exists();
        
        if ($exists) {
            return $this->errorResponse('Ya existe un nivel con ese nombre para el área seleccionada', 422);
        }

        $nivel = NivelCategoria::create($request->all());
        
        return $this->successResponse(
            new NivelCategoriaResource($nivel->load(['area', 'gradoMin', 'gradoMax'])),
            'Nivel creado correctamente',
            201
        );
    }

    /**
     * Display the specified resource.
     */
    public function show(int $id): JsonResponse
    {
        $nivel = NivelCategoria::with(['area', 'gradoMin', 'gradoMax'])->find($id);
        
        if (!$nivel) {
            return $this->errorResponse('Nivel no encontrado', 404);
        }
        
        return $this->successResponse(
            new NivelCategoriaResource($nivel),
            'Nivel obtenido correctamente'
        );
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $nivel = NivelCategoria::find($id);
        
        if (!$nivel) {
            return $this->errorResponse('Nivel no encontrado', 404);
        }
        
        $validator = Validator::make($request->all(), [
            'nombre_nivel' => 'sometimes|required|string|max:100',
            'id_area' => 'sometimes|required|exists:areas_competencia,id_area',
            'id_grado_min' => 'sometimes|required|exists:grados,id_grado',
            'id_grado_max' => 'sometimes|required|exists:grados,id_grado|gte:id_grado_min',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        // Check unique constraint (area, nombre_nivel) if changing area or name
        if ($request->has('id_area') || $request->has('nombre_nivel')) {
            $area_id = $request->id_area ?? $nivel->id_area;
            $nombre = $request->nombre_nivel ?? $nivel->nombre_nivel;
            
            $exists = NivelCategoria::where('id_area', $area_id)
                ->where('nombre_nivel', $nombre)
                ->where('id_nivel', '!=', $id)
                ->exists();
            
            if ($exists) {
                return $this->errorResponse('Ya existe un nivel con ese nombre para el área seleccionada', 422);
            }
        }

        $nivel->update($request->all());
        
        return $this->successResponse(
            new NivelCategoriaResource($nivel->fresh(['area', 'gradoMin', 'gradoMax'])),
            'Nivel actualizado correctamente'
        );
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(int $id): JsonResponse
    {
        $nivel = NivelCategoria::find($id);
        
        if (!$nivel) {
            return $this->errorResponse('Nivel no encontrado', 404);
        }
        
        // Check for related records
        if ($nivel->convocatoriaNiveles()->exists()) {
            return $this->errorResponse('No se puede eliminar el nivel porque tiene convocatorias asociadas', 409);
        }
        
        $nivel->delete();
        
        return $this->successResponse(
            null,
            'Nivel eliminado correctamente'
        );
    }
}
