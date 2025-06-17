<?php

namespace App\Http\Controllers\Api;

use App\Models\Estudiante;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Resources\EstudianteResource;
use App\Http\Requests\UpdateEstudianteRequest;
use App\Http\Requests\StoreEstudianteRequest;

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
    public function store(StoreEstudianteRequest $request): JsonResponse
    {
        $estudiante = Estudiante::create($request->validated());
        
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
        $estudiante = Estudiante::with(['unidadEducativa', 'grado', 'tutorLegal'])
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
    public function update(UpdateEstudianteRequest $request, int $id): JsonResponse
    {
        $estudiante = Estudiante::find($id);
        if (!$estudiante) {
            return $this->errorResponse('Estudiante no encontrado', 404);
        }

        $estudiante->update($request->validated());

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

        try {
            $estudiante->deleteIfNoDependencies(); // Delega la lógica al modelo

            return $this->successResponse(
                null,
                'Estudiante eliminado correctamente'
            );
        } catch (\Exception $e) {
            $statusCode = ($e->getCode() === 409) ? 409 : 500;
            return $this->errorResponse($e->getMessage(), $statusCode);
        }
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
        
        $estudiantes = Estudiante::search($search)
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

    public function showWithJoins(string $ci): JsonResponse
    {
        // 1. Selecciona campos específicos para evitar conflictos de nombres de columnas (si los hubiera)
        // y para aplanar los datos de las relaciones.
        $estudianteData = Estudiante::select(
            'estudiantes.*', // Selecciona todos los campos de la tabla estudiantes
            'unidades_educativas.nombre as unidad_educativa_nombre', // Renombra el campo para evitar colisiones
            'unidades_educativas.departamento as unidad_educativa_departamento',
            'unidades_educativas.provincia as unidad_educativa_provincia',
            'grados.nombre_grado as grado_nombre', // Necesitas seleccionar el nombre del grado también
            'tutores_legales.nombres as tutor_legal_nombres',
            'tutores_legales.apellidos as tutor_legal_apellidos',
            'tutores_legales.email as tutor_legal_email',
            'tutores_legales.parentesco as tutor_legal_parentesco',
            'tutores_legales.telefono as tutor_legal_telefono'
        )
        // 2. Asegúrate de que los nombres de las tablas en los joins sean correctos
        ->leftJoin('unidades_educativas', 'estudiantes.id_unidad_educativa', '=', 'unidades_educativas.id_unidad_educativa')
        ->leftJoin('grados', 'estudiantes.id_grado', '=', 'grados.id_grado') // Incluye la tabla de grados
        ->leftJoin('tutores_legales', 'estudiantes.id_tutor_legal', '=', 'tutores_legales.id_tutor_legal')
        // 3. ¡Importante! Estás buscando por 'ci', no por 'id'.
        ->where('estudiantes.ci', $ci) 
        ->first(); // Usamos first() porque esperamos un único estudiante por CI

        if (!$estudianteData) { // Ahora verificamos si el resultado es null
            return $this->errorResponse('Estudiante no encontrado', 404);
        }

        // 4. Reconstruye el array para la respuesta JSON con los campos aplanados
        $estudianteArray = [
            'nombres' => $estudianteData->nombres,
            'apellidos' => $estudianteData->apellidos,
            'fecha_nacimiento' => $estudianteData->fecha_nacimiento,
            'genero' => $estudianteData->genero,
            'email' => $estudianteData->email,
            'unidad_educativa' => [
                'nombre' => $estudianteData->unidad_educativa_nombre,
                'departamento' => $estudianteData->unidad_educativa_departamento,
                'provincia' => $estudianteData->unidad_educativa_provincia,
            ],
            'grado' => [ // Añade la información del grado
                'nombre' => $estudianteData->grado_nombre,
            ],
            'tutor_legal' => [
                'nombres' => $estudianteData->tutor_legal_nombres,
                'apellidos' => $estudianteData->tutor_legal_apellidos, // Aquí era un error, estaba 'nombres' de nuevo
                'email' => $estudianteData->tutor_legal_email,
                'parentesco' => $estudianteData->tutor_legal_parentesco,
                'telefono' => $estudianteData->tutor_legal_telefono,
            ],
        ];

        return response()->json([
            'message' => 'Estudiante obtenido correctamente',
            'data' => $estudianteArray,
        ], 200);
    }
}
