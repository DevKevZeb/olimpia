<?php

namespace App\Http\Controllers\Api;

use App\Models\Convocatoria;
use Illuminate\Http\Request;
use App\Http\Resources\ConvocatoriaResource;
use App\Http\Resources\ConvocatoriaCollection;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class ConvocatoriaController extends ApiController
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $convocatorias = Convocatoria::all();
        return $this->successResponse(
            new ConvocatoriaCollection($convocatorias),
            'Convocatorias obtenidas correctamente'
        );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
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
            new ConvocatoriaResource($convocatoria),
            'Convocatoria creada correctamente',
            201
        );
    }

    /**
     * Display the specified resource.
     */
    public function show(int $id): JsonResponse
    {
        $convocatoria = Convocatoria::with(['areas', 'niveles'])->find($id);
        
        if (!$convocatoria) {
            return $this->errorResponse('Convocatoria no encontrada', 404);
        }
        
        return $this->successResponse(
            new ConvocatoriaResource($convocatoria),
            'Convocatoria obtenida correctamente'
        );
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $convocatoria = Convocatoria::find($id);
        
        if (!$convocatoria) {
            return $this->errorResponse('Convocatoria no encontrada', 404);
        }
        
        $validator = Validator::make($request->all(), [
            'nombre' => 'sometimes|required|string|max:100',
            'fecha_inicio_inscripcion' => 'sometimes|required|date',
            'fecha_fin_inscripcion' => 'sometimes|required|date|after_or_equal:fecha_inicio_inscripcion',
            'max_areas_por_estudiante' => 'sometimes|required|integer|min:1',
            'estado' => 'sometimes|required|in:planificada,abierta,cerrada,finalizada',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        $convocatoria->update($request->all());
        
        return $this->successResponse(
            new ConvocatoriaResource($convocatoria),
            'Convocatoria actualizada correctamente'
        );
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(int $id): JsonResponse
    {
        $convocatoria = Convocatoria::find($id);
        
        if (!$convocatoria) {
            return $this->errorResponse('Convocatoria no encontrada', 404);
        }
        
        $convocatoria->delete();
        
        return $this->successResponse(
            null,
            'Convocatoria eliminada correctamente'
        );
    }
}
