<?php

namespace App\Http\Controllers\Api;

use App\Models\TutorLegal;
use Illuminate\Http\Request;
use App\Http\Resources\TutorLegalResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class TutorLegalController extends ApiController
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $tutores = TutorLegal::all();
        return $this->successResponse(
            TutorLegalResource::collection($tutores),
            'Tutores legales obtenidos correctamente'
        );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nombres' => 'required|string|max:100',
            'apellidos' => 'required|string|max:100',
            'ci' => 'required|string|max:20|unique:tutores_legales',
            'telefono' => 'required|string|max:20',
            'email' => 'nullable|email|max:100',
            'parentesco' => 'required|string|max:50',
            'es_el_mismo_estudiante' => 'boolean',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        $tutor = TutorLegal::create($request->all());
        
        return $this->successResponse(
            new TutorLegalResource($tutor),
            'Tutor legal creado correctamente',
            201
        );
    }

    /**
     * Display the specified resource.
     */
    public function show(int $id): JsonResponse
    {
        $tutor = TutorLegal::find($id);
        
        if (!$tutor) {
            return $this->errorResponse('Tutor legal no encontrado', 404);
        }
        
        return $this->successResponse(
            new TutorLegalResource($tutor),
            'Tutor legal obtenido correctamente'
        );
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $tutor = TutorLegal::find($id);
        
        if (!$tutor) {
            return $this->errorResponse('Tutor legal no encontrado', 404);
        }
        
        $validator = Validator::make($request->all(), [
            'nombres' => 'sometimes|required|string|max:100',
            'apellidos' => 'sometimes|required|string|max:100',
            'ci' => 'sometimes|required|string|max:20|unique:tutores_legales,ci,' . $id . ',id_tutor_legal',
            'telefono' => 'sometimes|required|string|max:20',
            'email' => 'nullable|email|max:100',
            'parentesco' => 'sometimes|required|string|max:50',
            'es_el_mismo_estudiante' => 'boolean',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        $tutor->update($request->all());
        
        return $this->successResponse(
            new TutorLegalResource($tutor),
            'Tutor legal actualizado correctamente'
        );
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(int $id): JsonResponse
    {
        $tutor = TutorLegal::find($id);
        
        if (!$tutor) {
            return $this->errorResponse('Tutor legal no encontrado', 404);
        }
        
        // Check for related records
        if ($tutor->estudiantes()->exists()) {
            return $this->errorResponse('No se puede eliminar el tutor legal porque tiene estudiantes asociados', 409);
        }
        
        $tutor->delete();
        
        return $this->successResponse(
            null,
            'Tutor legal eliminado correctamente'
        );
    }
}
