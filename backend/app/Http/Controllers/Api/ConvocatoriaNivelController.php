<?php

namespace App\Http\Controllers\Api;

use App\Models\ConvocatoriaNivel;
use Illuminate\Http\Request;
use App\Http\Resources\ConvocatoriaNivelResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class ConvocatoriaNivelController extends ApiController
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = ConvocatoriaNivel::with(['convocatoria', 'nivel']);
        
        // Filter by convocatoria_id if provided
        if ($request->has('convocatoria_id')) {
            $query->where('id_convocatoria', $request->convocatoria_id);
        }
        
        $niveles = $query->get();
            
        return $this->successResponse(
            ConvocatoriaNivelResource::collection($niveles),
            'Niveles de convocatoria obtenidos correctamente'
        );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id_convocatoria' => 'required|exists:convocatorias,id_convocatoria',
            'id_nivel' => 'required|exists:niveles_categoria,id_nivel',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }
        
        // Check if this combination already exists
        $exists = ConvocatoriaNivel::where('id_convocatoria', $request->id_convocatoria)
            ->where('id_nivel', $request->id_nivel)
            ->exists();
            
        if ($exists) {
            return $this->errorResponse('Este nivel ya está asignado a la convocatoria', 422);
        }

        $nivel = ConvocatoriaNivel::create($request->all());
        
        return $this->successResponse(
            new ConvocatoriaNivelResource($nivel->load(['convocatoria', 'nivel'])),
            'Nivel asignado a la convocatoria correctamente',
            201
        );
    }

    /**
     * Display the specified resource.
     */
    public function show(int $id): JsonResponse
    {
        $nivel = ConvocatoriaNivel::with(['convocatoria', 'nivel'])->find($id);
        
        if (!$nivel) {
            return $this->errorResponse('Nivel de convocatoria no encontrado', 404);
        }
        
        return $this->successResponse(
            new ConvocatoriaNivelResource($nivel),
            'Nivel de convocatoria obtenido correctamente'
        );
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $nivel = ConvocatoriaNivel::find($id);
        
        if (!$nivel) {
            return $this->errorResponse('Nivel de convocatoria no encontrado', 404);
        }

        $nivel->update($request->all());
        
        return $this->successResponse(
            new ConvocatoriaNivelResource($nivel->fresh(['convocatoria', 'nivel'])),
            'Nivel de convocatoria actualizado correctamente'
        );
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(int $id): JsonResponse
    {
        $nivel = ConvocatoriaNivel::find($id);
        
        if (!$nivel) {
            return $this->errorResponse('Nivel de convocatoria no encontrado', 404);
        }
        
        // Check for related inscriptions
        if ($nivel->inscripciones()->exists()) {
            return $this->errorResponse('No se puede eliminar este nivel porque tiene inscripciones asociadas', 409);
        }
        
        $nivel->delete();
        
        return $this->successResponse(
            null,
            'Nivel de convocatoria eliminado correctamente'
        );
    }
}
