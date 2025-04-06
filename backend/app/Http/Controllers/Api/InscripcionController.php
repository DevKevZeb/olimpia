<?php

namespace App\Http\Controllers\Api;

use App\Models\Inscripcion;
use App\Models\ConvocatoriaArea;
use App\Models\ConvocatoriaNivel;
use Illuminate\Http\Request;
use App\Http\Resources\InscripcionResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class InscripcionController extends ApiController
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Inscripcion::with(['estudiante', 'convocatoriaNivel.nivel', 'convocatoriaNivel.convocatoriaArea.area', 'tutorAcademico']);

        // Filter by convocatoria if provided
        if ($request->has('convocatoria_id')) {
            $query->whereHas('convocatoriaNivel.convocatoriaArea', function ($q) use ($request) {
                $q->where('id_convocatoria', $request->convocatoria_id);
            });
        }

        // Filter by estado if provided
        if ($request->has('estado')) {
            $query->where('estado', $request->estado);
        }

        $inscripciones = $query->paginate(15);

        return $this->successResponse(
            [
                'data' => InscripcionResource::collection($inscripciones),
                'pagination' => [
                    'total' => $inscripciones->total(),
                    'per_page' => $inscripciones->perPage(),
                    'current_page' => $inscripciones->currentPage(),
                    'last_page' => $inscripciones->lastPage(),
                ]
            ],
            'Inscripciones obtenidas correctamente'
        );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id_estudiante' => 'required|exists:estudiantes,id_estudiante',
            'id_convocatoria_nivel' => 'required|exists:convocatoria_niveles,id_convocatoria_nivel',
            'id_tutor_academico' => 'nullable|exists:tutores_academicos,id_tutor_academico',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        // Validar que el nivel exista
        $nivel = ConvocatoriaNivel::with('convocatoriaArea')->find($request->id_convocatoria_nivel);

        if (!$nivel) {
            return $this->errorResponse('El nivel de convocatoria no existe', 422);
        }

        // Check if student is already registered for this nivel in this convocatoria
        $exists = Inscripcion::where('id_estudiante', $request->id_estudiante)
            ->where('id_convocatoria_nivel', $request->id_convocatoria_nivel)
            ->exists();

        if ($exists) {
            return $this->errorResponse('El estudiante ya está inscrito en este nivel', 422);
        }

        try {
            // Use a transaction to ensure the InscripcionObserver fires correctly
            DB::beginTransaction();

            $data = $request->all();
            $data['fecha_inscripcion'] = now();
            $data['estado'] = 'pendiente';

            $inscripcion = Inscripcion::create($data);

            DB::commit();

            return $this->successResponse(
                new InscripcionResource($inscripcion->load(['estudiante', 'convocatoriaNivel.nivel', 'convocatoriaNivel.convocatoriaArea.area', 'tutorAcademico'])),
                'Inscripción creada correctamente',
                201
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse('Error al crear la inscripción: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(int $id): JsonResponse
    {
        $inscripcion = Inscripcion::with(['estudiante', 'convocatoriaNivel.nivel', 'convocatoriaNivel.convocatoriaArea.area', 'tutorAcademico'])
            ->find($id);

        if (!$inscripcion) {
            return $this->errorResponse('Inscripción no encontrada', 404);
        }

        return $this->successResponse(
            new InscripcionResource($inscripcion),
            'Inscripción obtenida correctamente'
        );
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $inscripcion = Inscripcion::find($id);

        if (!$inscripcion) {
            return $this->errorResponse('Inscripción no encontrada', 404);
        }

        $validator = Validator::make($request->all(), [
            'id_tutor_academico' => 'nullable|exists:tutores_academicos,id_tutor_academico',
            'estado' => 'sometimes|in:pendiente,pagada,verificada',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        $inscripcion->update($request->all());

        return $this->successResponse(
            new InscripcionResource($inscripcion->fresh(['estudiante', 'convocatoriaNivel.nivel', 'convocatoriaNivel.convocatoriaArea.area', 'tutorAcademico'])),
            'Inscripción actualizada correctamente'
        );
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(int $id): JsonResponse
    {
        $inscripcion = Inscripcion::find($id);

        if (!$inscripcion) {
            return $this->errorResponse('Inscripción no encontrada', 404);
        }

        // Check for related ordenes_pago
        if ($inscripcion->ordenesPago()->exists()) {
            return $this->errorResponse('No se puede eliminar la inscripción porque tiene órdenes de pago asociadas', 409);
        }

        $inscripcion->delete();

        return $this->successResponse(
            null,
            'Inscripción eliminada correctamente'
        );
    }
}
