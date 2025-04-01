<?php

namespace App\Http\Controllers\Api;

use App\Models\UnidadEducativa;
use Illuminate\Http\Request;
use App\Http\Resources\UnidadEducativaResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class UnidadEducativaController extends ApiController
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $unidades = UnidadEducativa::all();
        return $this->successResponse(
            UnidadEducativaResource::collection($unidades),
            'Unidades educativas obtenidas correctamente'
        );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:200',
            'departamento' => 'required|string|max:100',
            'provincia' => 'required|string|max:100',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        $unidad = UnidadEducativa::create($request->all());
        
        return $this->successResponse(
            new UnidadEducativaResource($unidad),
            'Unidad educativa creada correctamente',
            201
        );
    }

    /**
     * Display the specified resource.
     */
    public function show(int $id): JsonResponse
    {
        $unidad = UnidadEducativa::find($id);
        
        if (!$unidad) {
            return $this->errorResponse('Unidad educativa no encontrada', 404);
        }
        
        return $this->successResponse(
            new UnidadEducativaResource($unidad),
            'Unidad educativa obtenida correctamente'
        );
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $unidad = UnidadEducativa::find($id);
        
        if (!$unidad) {
            return $this->errorResponse('Unidad educativa no encontrada', 404);
        }
        
        $validator = Validator::make($request->all(), [
            'nombre' => 'sometimes|required|string|max:200',
            'departamento' => 'sometimes|required|string|max:100',
            'provincia' => 'sometimes|required|string|max:100',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        $unidad->update($request->all());
        
        return $this->successResponse(
            new UnidadEducativaResource($unidad),
            'Unidad educativa actualizada correctamente'
        );
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(int $id): JsonResponse
    {
        $unidad = UnidadEducativa::find($id);
        
        if (!$unidad) {
            return $this->errorResponse('Unidad educativa no encontrada', 404);
        }
        
        // Check for related records
        if ($unidad->estudiantes()->exists() || $unidad->listasInscripcion()->exists()) {
            return $this->errorResponse('No se puede eliminar la unidad educativa porque tiene registros asociados', 409);
        }
        
        $unidad->delete();
        
        return $this->successResponse(
            null,
            'Unidad educativa eliminada correctamente'
        );
    }
}
