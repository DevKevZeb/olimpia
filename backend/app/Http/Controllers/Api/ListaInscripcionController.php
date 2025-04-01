<?php

namespace App\Http\Controllers\Api;

use App\Models\ListaInscripcion;
use App\Models\DetalleListaInscripcion;
use Illuminate\Http\Request;
use App\Http\Resources\ListaInscripcionResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ListaInscripcionController extends ApiController
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = ListaInscripcion::with('unidadEducativa');
        
        // Filter by unidad_educativa if provided
        if ($request->has('unidad_educativa_id')) {
            $query->where('id_unidad_educativa', $request->unidad_educativa_id);
        }
        
        $listas = $query->paginate(15);
            
        return $this->successResponse(
            [
                'data' => ListaInscripcionResource::collection($listas),
                'pagination' => [
                    'total' => $listas->total(),
                    'per_page' => $listas->perPage(),
                    'current_page' => $listas->currentPage(),
                    'last_page' => $listas->lastPage(),
                ]
            ],
            'Listas de inscripción obtenidas correctamente'
        );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id_unidad_educativa' => 'required|exists:unidades_educativas,id_unidad_educativa',
            'detalles' => 'required|array|min:1',
            'detalles.*.id_estudiante' => 'required|exists:estudiantes,id_estudiante',
            'detalles.*.id_convocatoria_area' => 'required|exists:convocatoria_areas,id_convocatoria_area',
            'detalles.*.id_convocatoria_nivel' => 'required|exists:convocatoria_niveles,id_convocatoria_nivel',
            'detalles.*.id_tutor_academico' => 'nullable|exists:tutores_academicos,id_tutor_academico',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        try {
            DB::beginTransaction();
            
            // Create the lista
            $lista = ListaInscripcion::create([
                'codigo_lista' => 'LISTA-' . Str::random(8),
                'id_unidad_educativa' => $request->id_unidad_educativa,
                'fecha_creacion' => now(),
            ]);
            
            // Create the detalles
            foreach ($request->detalles as $detalle) {
                // Validate area and nivel belong to the same convocatoria
                $area = \App\Models\ConvocatoriaArea::find($detalle['id_convocatoria_area']);
                $nivel = \App\Models\ConvocatoriaNivel::find($detalle['id_convocatoria_nivel']);
                
                if (!$area || !$nivel || $area->id_convocatoria != $nivel->id_convocatoria) {
                    throw new \Exception('El área y el nivel deben pertenecer a la misma convocatoria');
                }
                
                // Check if student is already registered for this area in this convocatoria via another list
                $exists = DetalleListaInscripcion::whereHas('lista', function($q) use ($lista) {
                        $q->where('id_lista', '!=', $lista->id_lista);
                    })
                    ->where('id_estudiante', $detalle['id_estudiante'])
                    ->where('id_convocatoria_area', $detalle['id_convocatoria_area'])
                    ->exists();
                    
                if ($exists) {
                    throw new \Exception("El estudiante con ID {$detalle['id_estudiante']} ya está inscrito en este área en otra lista");
                }
                
                // Create the detalle
                DetalleListaInscripcion::create([
                    'id_lista' => $lista->id_lista,
                    'id_estudiante' => $detalle['id_estudiante'],
                    'id_convocatoria_area' => $detalle['id_convocatoria_area'],
                    'id_convocatoria_nivel' => $detalle['id_convocatoria_nivel'],
                    'id_tutor_academico' => $detalle['id_tutor_academico'] ?? null,
                    'fecha_registro' => now(),
                ]);
            }
            
            DB::commit();
            
            return $this->successResponse(
                new ListaInscripcionResource($lista->load(['unidadEducativa', 'detalles.estudiante', 'detalles.convocatoriaArea', 'detalles.convocatoriaNivel'])),
                'Lista de inscripción creada correctamente',
                201
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse('Error al crear la lista de inscripción: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(int $id): JsonResponse
    {
        $lista = ListaInscripcion::with(['unidadEducativa', 'detalles.estudiante', 'detalles.convocatoriaArea.area', 'detalles.convocatoriaNivel.nivel'])
            ->find($id);
        
        if (!$lista) {
            return $this->errorResponse('Lista de inscripción no encontrada', 404);
        }
        
        return $this->successResponse(
            new ListaInscripcionResource($lista),
            'Lista de inscripción obtenida correctamente'
        );
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $lista = ListaInscripcion::find($id);
        
        if (!$lista) {
            return $this->errorResponse('Lista de inscripción no encontrada', 404);
        }
        
        $validator = Validator::make($request->all(), [
            'id_unidad_educativa' => 'sometimes|required|exists:unidades_educativas,id_unidad_educativa',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        $lista->update($request->all());
        
        return $this->successResponse(
            new ListaInscripcionResource($lista->fresh(['unidadEducativa', 'detalles.estudiante'])),
            'Lista de inscripción actualizada correctamente'
        );
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(int $id): JsonResponse
    {
        $lista = ListaInscripcion::find($id);
        
        if (!$lista) {
            return $this->errorResponse('Lista de inscripción no encontrada', 404);
        }
        
        // Check for related ordenes_pago
        if ($lista->ordenesPago()->exists()) {
            return $this->errorResponse('No se puede eliminar la lista porque tiene órdenes de pago asociadas', 409);
        }
        
        // Use a transaction to delete all detalles first, then the lista
        try {
            DB::beginTransaction();
            
            $lista->detalles()->delete();
            $lista->delete();
            
            DB::commit();
            
            return $this->successResponse(
                null,
                'Lista de inscripción eliminada correctamente'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse('Error al eliminar la lista de inscripción: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Add a new detail to an existing list
     */
    public function addDetail(Request $request, int $id): JsonResponse
    {
        $lista = ListaInscripcion::find($id);
        
        if (!$lista) {
            return $this->errorResponse('Lista de inscripción no encontrada', 404);
        }
        
        $validator = Validator::make($request->all(), [
            'id_estudiante' => 'required|exists:estudiantes,id_estudiante',
            'id_convocatoria_area' => 'required|exists:convocatoria_areas,id_convocatoria_area',
            'id_convocatoria_nivel' => 'required|exists:convocatoria_niveles,id_convocatoria_nivel',
            'id_tutor_academico' => 'nullable|exists:tutores_academicos,id_tutor_academico',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }
        
        try {
            // Validate area and nivel belong to the same convocatoria
            $area = \App\Models\ConvocatoriaArea::find($request->id_convocatoria_area);
            $nivel = \App\Models\ConvocatoriaNivel::find($request->id_convocatoria_nivel);
            
            if (!$area || !$nivel || $area->id_convocatoria != $nivel->id_convocatoria) {
                return $this->errorResponse('El área y el nivel deben pertenecer a la misma convocatoria', 422);
            }
            
            // Check if student is already in this list for this area
            $existsInList = DetalleListaInscripcion::where('id_lista', $id)
                ->where('id_estudiante', $request->id_estudiante)
                ->where('id_convocatoria_area', $request->id_convocatoria_area)
                ->exists();
                
            if ($existsInList) {
                return $this->errorResponse('El estudiante ya está en esta lista para el área seleccionada', 422);
            }
            
            // Check if student is already registered for this area in this convocatoria via another list
            $existsInOtherList = DetalleListaInscripcion::whereHas('lista', function($q) use ($id) {
                    $q->where('id_lista', '!=', $id);
                })
                ->where('id_estudiante', $request->id_estudiante)
                ->where('id_convocatoria_area', $request->id_convocatoria_area)
                ->exists();
                
            if ($existsInOtherList) {
                return $this->errorResponse('El estudiante ya está inscrito en este área en otra lista', 422);
            }
            
            // Create the detalle
            $detalle = DetalleListaInscripcion::create([
                'id_lista' => $id,
                'id_estudiante' => $request->id_estudiante,
                'id_convocatoria_area' => $request->id_convocatoria_area,
                'id_convocatoria_nivel' => $request->id_convocatoria_nivel,
                'id_tutor_academico' => $request->id_tutor_academico,
                'fecha_registro' => now(),
            ]);
            
            return $this->successResponse(
                $detalle->load(['estudiante', 'convocatoriaArea.area', 'convocatoriaNivel.nivel']),
                'Detalle agregado correctamente',
                201
            );
        } catch (\Exception $e) {
            return $this->errorResponse('Error al agregar el detalle: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Remove a detail from a list
     */
    public function removeDetail(int $id, int $detalleId): JsonResponse
    {
        $detalle = DetalleListaInscripcion::where('id_lista', $id)
            ->where('id_detalle', $detalleId)
            ->first();
            
        if (!$detalle) {
            return $this->errorResponse('Detalle no encontrado en la lista especificada', 404);
        }
        
        // Check if this student has already been registered via this list
        // In that case, we shouldn't allow deletion
        $exists = \App\Models\Inscripcion::where('id_estudiante', $detalle->id_estudiante)
            ->where('id_convocatoria_area', $detalle->id_convocatoria_area)
            ->exists();
            
        if ($exists) {
            return $this->errorResponse('No se puede eliminar el detalle porque el estudiante ya está inscrito', 409);
        }
        
        $detalle->delete();
        
        return $this->successResponse(
            null,
            'Detalle eliminado correctamente'
        );
    }
}
