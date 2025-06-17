<?php

namespace App\Http\Controllers\Api;

use App\Models\Convocatoria;
use App\Models\RequisitoConvocatoria;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

use App\Http\Resources\RequisitoConvocatoriaResource;
use App\Http\Requests\UpdateRequisitoConvocatoriaRequest;
use App\Http\Requests\StoreRequisitoConvocatoriaRequest;
use App\Services\RequisitoConvocatoriaService;

class RequisitoConvocatoriaController extends ApiController
{
    protected $requisitoConvocatoriaService;

    public function __construct(RequisitoConvocatoriaService $requisitoConvocatoriaService)
    {
        $this->requisitoConvocatoriaService = $requisitoConvocatoriaService;
    }
    
    public function index(Convocatoria $convocatoria): JsonResponse
    {
        $requisitos = RequisitoConvocatoria::where('id_convocatoria', $convocatoria->id_convocatoria)->get();
        return $this->successResponse(
            RequisitoConvocatoriaResource::collection($requisitos), // Usar Resource Collection
            'Requisitos obtenidos correctamente'
        );
    }

    public function store(StoreRequisitoConvocatoriaRequest $request, Convocatoria $convocatoria): JsonResponse
    {
        try {
            $newRequisitos = $this->requisitoConvocatoriaService->updateConvocatoriaRequirements(
                $convocatoria,
                $request->validated() // Usar validated() para obtener solo los datos validados
            );

            return $this->successResponse(
                RequisitoConvocatoriaResource::collection($newRequisitos), // Opcional: devolver los requisitos creados
                'Requisitos configurados exitosamente',
                201
            );
        } catch (\Exception $e) {
            return $this->errorResponse('Error al configurar los requisitos: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Display the specified resource.
     *
     * @param  \App\Models\RequisitoConvocatoria  $requisitoConvocatoria
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(RequisitoConvocatoria $requisitoConvocatoria): JsonResponse
    {
        return $this->successResponse(
            new RequisitoConvocatoriaResource($requisitoConvocatoria), // Usar Resource si existe
            'Requisito obtenido exitosamente'
        );
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\RequisitoConvocatoria  $requisitoConvocatoria
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(UpdateRequisitoConvocatoriaRequest $request, RequisitoConvocatoria $requisitoConvocatoria): JsonResponse
    {
        $requisitoConvocatoria->update($request->validated());

        return $this->successResponse(
            new RequisitoConvocatoriaResource($requisitoConvocatoria), // Usar Resource si existe
            'Requisito actualizado exitosamente'
        );
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Models\RequisitoConvocatoria  $requisitoConvocatoria
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(RequisitoConvocatoria $requisitoConvocatoria): JsonResponse
    {
        try {
            $requisitoConvocatoria->delete();
            return $this->successResponse(null, 'Requisito eliminado exitosamente');
        } catch (\Exception $e) {
            return $this->errorResponse('Error al eliminar el requisito: ' . $e->getMessage(), 500);
        }
    }
}