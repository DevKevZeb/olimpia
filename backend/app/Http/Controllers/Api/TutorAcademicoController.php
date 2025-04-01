<?php

namespace App\Http\Controllers\Api;

use App\Models\TutorAcademico;
use Illuminate\Http\Request;
use App\Http\Resources\TutorAcademicoResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class TutorAcademicoController extends ApiController
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $tutores = TutorAcademico::all();
        return $this->successResponse(
            TutorAcademicoResource::collection($tutores),
            'Tutores académicos obtenidos correctamente'
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
            'ci' => 'required|string|max:20|unique:tutores_academicos',
            'telefono' => 'nullable|string|max:20',
            'email' => 'required|email|max:100',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        $tutor = TutorAcademico::create($request->all());
        
        return $this->successResponse(
            new TutorAcademicoResource($tutor),
            'Tutor académico creado correctamente',
            201
        );
    }

    /**
     * Display the specified resource.
     */
    public function show(int $id): JsonResponse
    {
        $tutor = TutorAcademico::find($id);
        
        if (!$tutor) {
            return $this->errorResponse('Tutor académico no encontrado', 404);
        }
        
        return $this->successResponse(
            new TutorAcademicoResource($tutor),
            'Tutor académico obtenido correctamente'
        );
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $tutor = TutorAcademico::find($id);
        
        if (!$tutor) {
            return $this->errorResponse('Tutor académico no encontrado', 404);
        }
        
        $validator = Validator::make($request->all(), [
            'nombres' => 'sometimes|required|string|max:100',
            'apellidos' => 'sometimes|required|string|max:100',
            'ci' => 'sometimes|required|string|max:20|unique:tutores_academicos,ci,' . $id . ',id_tutor_academico',
            'telefono' => 'nullable|string|max:20',
            'email' => 'sometimes|required|email|max:100',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        $tutor->update($request->all());
        
        return $this->successResponse(
            new TutorAcademicoResource($tutor),
            'Tutor académico actualizado correctamente'
        );
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(int $id): JsonResponse
    {
        $tutor = TutorAcademico::find($id);
        
        if (!$tutor) {
            return $this->errorResponse('Tutor académico no encontrado', 404);
        }
        
        // Check for related records
        if ($tutor->inscripciones()->exists()) {
            return $this->errorResponse('No se puede eliminar el tutor académico porque tiene inscripciones asociadas', 409);
        }
        
        $tutor->delete();
        
        return $this->successResponse(
            null,
            'Tutor académico eliminado correctamente'
        );
    }
}
