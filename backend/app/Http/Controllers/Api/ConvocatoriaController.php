<?php

namespace App\Http\Controllers\Api;

use App\Models\Convocatoria;
use Illuminate\Http\Request;
use App\Http\Resources\ConvocatoriaResource;
use App\Http\Resources\ConvocatoriaCollection;
use Illuminate\Http\JsonResponse;
use App\Http\Requests\StoreConvocatoriaRequest;
use App\Http\Requests\UpdateConvocatoriaRequest;

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
    public function store(StoreConvocatoriaRequest $request): JsonResponse
    {
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
    public function update(UpdateConvocatoriaRequest $request, int $id): JsonResponse
    {
        $convocatoria = Convocatoria::find($id);
        
        if (!$convocatoria) {
            return $this->errorResponse('Convocatoria no encontrada', 404);
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
