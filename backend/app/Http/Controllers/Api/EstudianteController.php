<?php

namespace App\Http\Controllers\Api;

use App\Models\Estudiante;
use Illuminate\Http\Request;
use App\Http\Resources\EstudianteResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class EstudianteController extends ApiController
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $estudiantes = Estudiante::with(['unidadEducativa', 'grado', 'tutorLegal'])
            ->paginate(15);
            
        return $this->successResponse(
            [
                'data' => EstudianteResource::collection($estudiantes),
                'pagination' => [
                    'total' => $estudiantes->total(),
                    'per_page' => $estudiantes->perPage(),
                    'current_page' => $estudiantes->currentPage(),
                    'last_page' => $estudiantes->lastPage(),
                ]
            ],
            'Estudiantes obtenidos correctamente'
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
            'ci' => 'required|string|max:20|unique:estudiantes',
            'fecha_nacimiento' => 'required|date',
            'email' => 'nullable|email|max:100',
            'id_unidad_educativa' => 'required|exists:unidades_educativas,id_unidad_educativa',
            'id_grado' => 'required|exists:grados,id_grado',
            'id_tutor_legal' => 'required|exists:tutores_legales,id_tutor_legal',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        $estudiante = Estudiante::create($request->all());
        
        return $this->successResponse(
            new EstudianteResource($estudiante->load(['unidadEducativa', 'grado', 'tutorLegal'])),
            'Estudiante creado correctamente',
            201
        );
    }

    /**
     * Display the specified resource.
     */
    public function show(int $id): JsonResponse
    {
        $estudiante = Estudiante::with(['unidadEducativa', 'grado', 'tutorLegal', 'inscripciones'])
            ->find($id);
        
        if (!$estudiante) {
            return $this->errorResponse('Estudiante no encontrado', 404);
        }
        
        return $this->successResponse(
            new EstudianteResource($estudiante),
            'Estudiante obtenido correctamente'
        );
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $estudiante = Estudiante::find($id);
        
        if (!$estudiante) {
            return $this->errorResponse('Estudiante no encontrado', 404);
        }
        
        $validator = Validator::make($request->all(), [
            'nombres' => 'sometimes|required|string|max:100',
            'apellidos' => 'sometimes|required|string|max:100',
            'ci' => 'sometimes|required|string|max:20|unique:estudiantes,ci,' . $id . ',id_estudiante',
            'fecha_nacimiento' => 'sometimes|required|date',
            'email' => 'nullable|email|max:100',
            'id_unidad_educativa' => 'sometimes|required|exists:unidades_educativas,id_unidad_educativa',
            'id_grado' => 'sometimes|required|exists:grados,id_grado',
            'id_tutor_legal' => 'sometimes|required|exists:tutores_legales,id_tutor_legal',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        $estudiante->update($request->all());
        
        return $this->successResponse(
            new EstudianteResource($estudiante->fresh(['unidadEducativa', 'grado', 'tutorLegal'])),
            'Estudiante actualizado correctamente'
        );
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(int $id): JsonResponse
    {
        $estudiante = Estudiante::find($id);
        
        if (!$estudiante) {
            return $this->errorResponse('Estudiante no encontrado', 404);
        }
        
        // Check for related records
        if ($estudiante->inscripciones()->exists() || $estudiante->detallesLista()->exists()) {
            return $this->errorResponse('No se puede eliminar el estudiante porque tiene inscripciones asociadas', 409);
        }
        
        $estudiante->delete();
        
        return $this->successResponse(
            null,
            'Estudiante eliminado correctamente'
        );
    }
    
    /**
     * Search students by name, surname or CI
     */
    public function search(Request $request): JsonResponse
    {
        $search = $request->query('query');
        if (!$search) {
            return $this->errorResponse('Debe proporcionar un término de búsqueda', 422);
        }
        
        $estudiantes = Estudiante::where('nombres', 'like', "%{$search}%")
            ->orWhere('apellidos', 'like', "%{$search}%")
            ->orWhere('ci', 'like', "%{$search}%")
            ->with(['unidadEducativa', 'grado', 'tutorLegal'])
            ->paginate(15);
            
        return $this->successResponse(
            [
                'data' => EstudianteResource::collection($estudiantes),
                'pagination' => [
                    'total' => $estudiantes->total(),
                    'per_page' => $estudiantes->perPage(),
                    'current_page' => $estudiantes->currentPage(),
                    'last_page' => $estudiantes->lastPage(),
                ]
            ],
            'Resultados de búsqueda obtenidos correctamente'
        );
    }
}
