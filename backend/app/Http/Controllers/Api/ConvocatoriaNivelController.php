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
        $query = ConvocatoriaNivel::with(['convocatoriaArea.convocatoria', 'convocatoriaArea.area', 'nivel', 'gradoMin', 'gradoMax']);

        // Filter by convocatoria_area_id if provided
        if ($request->has('convocatoria_area_id')) {
            $query->where('id_convocatoria_area', $request->convocatoria_area_id);
        }

        // Filter by convocatoria_id if provided
        if ($request->has('convocatoria_id')) {
            $query->whereHas('convocatoriaArea', function ($q) use ($request) {
                $q->where('id_convocatoria', $request->convocatoria_id);
            });
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
            'id_convocatoria_area' => 'required|exists:convocatoria_areas,id_convocatoria_area',
            'id_nivel' => 'required|exists:niveles_categoria,id_nivel',
            'id_grado_min' => 'required|exists:grados,id_grado',
            'id_grado_max' => 'required|exists:grados,id_grado',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        // Check if this combination already exists
        $exists = ConvocatoriaNivel::where('id_convocatoria_area', $request->id_convocatoria_area)
            ->where('id_nivel', $request->id_nivel)
            ->exists();

        if ($exists) {
            return $this->errorResponse('Este nivel ya está asignado al área de la convocatoria', 422);
        }

        // Validate that id_grado_min is less than or equal to id_grado_max
        if ($request->id_grado_min > $request->id_grado_max) {
            return $this->errorResponse('El grado mínimo no puede ser mayor que el grado máximo', 422);
        }

        $nivel = ConvocatoriaNivel::create($request->all());

        return $this->successResponse(
            new ConvocatoriaNivelResource($nivel->load(['convocatoriaArea.convocatoria', 'convocatoriaArea.area', 'nivel', 'gradoMin', 'gradoMax'])),
            'Nivel asignado al área de la convocatoria correctamente',
            201
        );
    }

    /**
     * Display the specified resource.
     */
    public function show(int $id): JsonResponse
    {
        $nivel = ConvocatoriaNivel::with(['convocatoriaArea.convocatoria', 'convocatoriaArea.area', 'nivel', 'gradoMin', 'gradoMax'])->find($id);

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
            new ConvocatoriaNivelResource($nivel->fresh(['convocatoriaArea.convocatoria', 'convocatoriaArea.area', 'nivel', 'gradoMin', 'gradoMax'])),
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
