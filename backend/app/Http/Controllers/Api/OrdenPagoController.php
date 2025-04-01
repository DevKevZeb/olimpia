<?php

namespace App\Http\Controllers\Api;

use App\Models\OrdenPago;
use App\Models\Inscripcion;
use App\Models\ListaInscripcion;
use Illuminate\Http\Request;
use App\Http\Resources\OrdenPagoResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrdenPagoController extends ApiController
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = OrdenPago::with(['inscripcion.estudiante', 'lista.unidadEducativa']);
        
        // Filter by estado if provided
        if ($request->has('estado')) {
            $query->where('estado', $request->estado);
        }
        
        // Filter by tipo_origen if provided
        if ($request->has('tipo_origen')) {
            $query->where('tipo_origen', $request->tipo_origen);
        }
        
        $ordenes = $query->paginate(15);
            
        return $this->successResponse(
            [
                'data' => OrdenPagoResource::collection($ordenes),
                'pagination' => [
                    'total' => $ordenes->total(),
                    'per_page' => $ordenes->perPage(),
                    'current_page' => $ordenes->currentPage(),
                    'last_page' => $ordenes->lastPage(),
                ]
            ],
            'Órdenes de pago obtenidas correctamente'
        );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'tipo_origen' => 'required|in:individual,lista',
            'id_inscripcion' => 'required_if:tipo_origen,individual|exists:inscripciones,id_inscripcion',
            'id_lista' => 'required_if:tipo_origen,lista|exists:listas_inscripcion,id_lista',
            'fecha_vencimiento' => 'required|date|after:today',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        try {
            DB::beginTransaction();
            
            $montoTotal = 0;
            
            // Calculate monto_total based on tipo_origen
            if ($request->tipo_origen === 'individual') {
                $inscripcion = Inscripcion::with('convocatoriaArea')->findOrFail($request->id_inscripcion);
                $montoTotal = $inscripcion->convocatoriaArea->costo_inscripcion;
                
                // Check if there's already an active order for this inscripcion
                $existingOrder = OrdenPago::where('id_inscripcion', $request->id_inscripcion)
                    ->whereIn('estado', ['pendiente'])
                    ->exists();
                    
                if ($existingOrder) {
                    return $this->errorResponse('Ya existe una orden de pago pendiente para esta inscripción', 422);
                }
                
            } else { // tipo_origen === 'lista'
                $lista = ListaInscripcion::with('detalles.convocatoriaArea')->findOrFail($request->id_lista);
                
                // Check if there's already an active order for this list
                $existingOrder = OrdenPago::where('id_lista', $request->id_lista)
                    ->whereIn('estado', ['pendiente'])
                    ->exists();
                    
                if ($existingOrder) {
                    return $this->errorResponse('Ya existe una orden de pago pendiente para esta lista', 422);
                }
                
                // Sum the cost of all inscriptions in the list
                foreach ($lista->detalles as $detalle) {
                    $montoTotal += $detalle->convocatoriaArea->costo_inscripcion;
                }
            }
            
            // Create the orden de pago
            $orden = OrdenPago::create([
                'codigo_unico' => 'OP-' . Str::upper(Str::random(10)),
                'tipo_origen' => $request->tipo_origen,
                'id_inscripcion' => $request->tipo_origen === 'individual' ? $request->id_inscripcion : null,
                'id_lista' => $request->tipo_origen === 'lista' ? $request->id_lista : null,
                'monto_total' => $montoTotal,
                'fecha_emision' => now(),
                'fecha_vencimiento' => $request->fecha_vencimiento,
                'estado' => 'pendiente',
            ]);
            
            DB::commit();
            
            return $this->successResponse(
                new OrdenPagoResource($orden->load(['inscripcion.estudiante', 'lista.unidadEducativa'])),
                'Orden de pago creada correctamente',
                201
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse('Error al crear la orden de pago: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(int $id): JsonResponse
    {
        $orden = OrdenPago::with([
                'inscripcion.estudiante', 
                'inscripcion.convocatoriaArea.area', 
                'lista.unidadEducativa',
                'lista.detalles.estudiante',
                'lista.detalles.convocatoriaArea.area',
                'comprobantes'
            ])
            ->find($id);
        
        if (!$orden) {
            return $this->errorResponse('Orden de pago no encontrada', 404);
        }
        
        return $this->successResponse(
            new OrdenPagoResource($orden),
            'Orden de pago obtenida correctamente'
        );
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $orden = OrdenPago::find($id);
        
        if (!$orden) {
            return $this->errorResponse('Orden de pago no encontrada', 404);
        }
        
        $validator = Validator::make($request->all(), [
            'fecha_vencimiento' => 'sometimes|required|date|after:today',
            'estado' => 'sometimes|required|in:pendiente,pagada,vencida',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        $orden->update($request->all());
        
        return $this->successResponse(
            new OrdenPagoResource($orden->fresh(['inscripcion.estudiante', 'lista.unidadEducativa'])),
            'Orden de pago actualizada correctamente'
        );
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(int $id): JsonResponse
    {
        $orden = OrdenPago::find($id);
        
        if (!$orden) {
            return $this->errorResponse('Orden de pago no encontrada', 404);
        }
        
        // Check for related comprobantes
        if ($orden->comprobantes()->exists()) {
            return $this->errorResponse('No se puede eliminar la orden de pago porque tiene comprobantes asociados', 409);
        }
        
        $orden->delete();
        
        return $this->successResponse(
            null,
            'Orden de pago eliminada correctamente'
        );
    }
    
    /**
     * Get an order by its unique code
     */
    public function getByCode(Request $request): JsonResponse
    {
        $codigo = $request->query('codigo');
        if (!$codigo) {
            return $this->errorResponse('Debe proporcionar un código', 422);
        }
        
        $orden = OrdenPago::with([
                'inscripcion.estudiante', 
                'inscripcion.convocatoriaArea.area', 
                'lista.unidadEducativa',
                'lista.detalles.estudiante',
                'lista.detalles.convocatoriaArea.area',
            ])
            ->where('codigo_unico', $codigo)
            ->first();
            
        if (!$orden) {
            return $this->errorResponse('Orden de pago no encontrada', 404);
        }
        
        return $this->successResponse(
            new OrdenPagoResource($orden),
            'Orden de pago obtenida correctamente'
        );
    }
}
