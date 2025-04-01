<?php

namespace App\Http\Controllers\Api;

use App\Models\Grado;
use Illuminate\Http\Request;
use App\Http\Resources\GradoResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class GradoController extends ApiController
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $grados = Grado::orderBy('orden')->get();
        return $this->successResponse(
            GradoResource::collection($grados),
            'Grados obtenidos correctamente'
        );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nombre_grado' => 'required|string|max:50|unique:grados',
            'orden' => 'required|integer|unique:grados',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        $grado = Grado::create($request->all());
        
        return $this->successResponse(
            new GradoResource($grado),
            'Grado creado correctamente',
            201
        );
    }

    /**
     * Display the specified resource.
     */
    public function show(int $id): JsonResponse
    {
        $grado = Grado::find($id);
        
        if (!$grado) {
            return $this->errorResponse('Grado no encontrado', 404);
        }
        
        return $this->successResponse(
            new GradoResource($grado),
            'Grado obtenido correctamente'
        );
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $grado = Grado::find($id);
        
        if (!$grado) {
            return $this->errorResponse('Grado no encontrado', 404);
        }
        
        $validator = Validator::make($request->all(), [
            'nombre_grado' => 'sometimes|required|string|max:50|unique:grados,nombre_grado,' . $id . ',id_grado',
            'orden' => 'sometimes|required|integer|unique:grados,orden,' . $id . ',id_grado',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        $grado->update($request->all());
        
        return $this->successResponse(
            new GradoResource($grado),
            'Grado actualizado correctamente'
        );
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(int $id): JsonResponse
    {
        $grado = Grado::find($id);
        
        if (!$grado) {
            return $this->errorResponse('Grado no encontrado', 404);
        }
        
        // Check for related records
        if ($grado->estudiantes()->exists() || 
            $grado->nivelesMin()->exists() || 
            $grado->nivelesMax()->exists()) {
            return $this->errorResponse('No se puede eliminar el grado porque tiene registros asociados', 409);
        }
        
        $grado->delete();
        
        return $this->successResponse(
            null,
            'Grado eliminado correctamente'
        );
    }
}
