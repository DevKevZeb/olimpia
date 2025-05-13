<?php

namespace App\Http\Controllers\Api;

use App\Models\AreaCompetencia;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class AreaController extends ApiController
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
{
    $nombres = AreaCompetencia::orderBy('nombre_area')->pluck('nombre_area');
    return response()->json($nombres);
}


    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nombre_area' => 'required|string|max:100|unique:areas_competencia,nombre_area',
            'descripcion' => 'nullable|string|max:200',

        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        $area = AreaCompetencia::create([
            'nombre_area' => $request->nombre_area,
            'descripcion' => $request->descripcion,
        ]);

        return $this->successResponse(
            $area,
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
            $area,
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
            'nombre_area' => 'sometimes|required|string|max:100|unique:areas_competencia,nombre_area,' . $area->id_area . ',id_area',
            'descripcion' => 'sometimes|nullable|string|max:200',

        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        $area->update($request->all());

        return $this->successResponse(
            $area,
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
