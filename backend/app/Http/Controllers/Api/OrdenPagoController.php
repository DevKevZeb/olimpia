<?php

namespace App\Http\Controllers\Api;

use App\Models\OrdenPago;
use App\Models\ListaInscripcion;
use Illuminate\Http\Request;
use App\Http\Resources\OrdenPagoResource;
use App\Models\EncargadoPago;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrdenPagoController extends ApiController
{
    /**
     * Display a listing of the resource.
     */    public function index(Request $request): JsonResponse
    {
        // Updated to remove obsolete inscripcion relationship since Inscripcion model was deleted
        $query = OrdenPago::with(['lista.unidadEducativa']);
        
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
     */    public function store(Request $request): JsonResponse
    {
        // Updated validation to only support lista type (individual inscriptions removed)
        $validator = Validator::make($request->all(), [
            'tipo_origen' => 'required|in:lista',
            'id_lista' => 'required|exists:listas_inscripcion,id_lista',
            'fecha_vencimiento' => 'required|date|after:today',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        try {
            DB::beginTransaction();
            
            // Only handle lista type since individual inscriptions are no longer supported
            $lista = ListaInscripcion::with('detalles.convocatoriaNivel.convocatoriaArea')->findOrFail($request->id_lista);
            
            // Check if there's already an active order for this list
            $existingOrder = OrdenPago::where('id_lista', $request->id_lista)
                ->whereIn('estado', ['pendiente'])
                ->exists();
                
            if ($existingOrder) {
                return $this->errorResponse('Ya existe una orden de pago pendiente para esta lista', 422);
            }
            
            // Sum the cost of all registrations in the list
            $montoTotal = 0;
            foreach ($lista->detalles as $detalle) {
                $montoTotal += $detalle->convocatoriaNivel->convocatoriaArea->costo_inscripcion;
            }
            
            // Create the orden de pago
            $orden = OrdenPago::create([
                'codigo_unico' => 'OP-' . Str::upper(Str::random(10)),
                'tipo_origen' => 'lista',
                'id_lista' => $request->id_lista,
                'monto_total' => $montoTotal,
                'fecha_emision' => now(),
                'fecha_vencimiento' => $request->fecha_vencimiento,
                'estado' => 'pendiente',
            ]);
            
            DB::commit();
            
            return $this->successResponse(
                new OrdenPagoResource($orden->load(['lista.unidadEducativa'])),
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
    public function getByCode(Request $request, string $codigo): JsonResponse
    {
        if (!$codigo) {
            return $this->errorResponse('Debe proporcionar un código', 422);
        }
        
        $orden = OrdenPago::where( "codigo_unico" ,  $codigo)->first();
        
        
        if(!$orden){
            return $this->errorResponse('El codigo que usted a ingresado no existe', 404);
        }
        
        $encargado = EncargadoPago::where("id_lista", $orden->id_lista)->first(); 
        if(!$encargado){
            return $this->errorResponse('El codigo que usted a ingresado no existe', 404);
        }

        $encargado = [
            "nombre" => $encargado->nombres . " " . $encargado->apellidos,
            "ci" => $encargado->ci,
            "email" => $encargado->email, 
        ];
        $montoTotal = $orden->monto_total;
        $orden = DB::select(
            'SELECT e.ci, e.nombres, e.apellidos, ac.nombre_area, nc.nombre_nivel, ca.costo_inscripcion
            FROM ordenes_pago op, convocatoria_niveles cn, niveles_categoria nc, areas_competencia ac,
                estudiantes e, convocatoria_areas ca, detalles_lista_inscripcion dli, listas_inscripcion li
            WHERE op.codigo_unico = ?
            AND op.id_lista = li.id_lista
            AND li.id_lista = dli.id_lista
            AND dli.id_convocatoria_nivel = cn.id_convocatoria_nivel
            AND dli.id_estudiante = e.id_estudiante
            AND cn.id_nivel = nc.id_nivel
            AND ac.id_area = ca.id_area
            AND cn.id_convocatoria_area = ca.id_convocatoria_area
            ORDER BY ci, nombres, apellidos
            ',
            [$codigo]
        );  
            
        if (!$orden) {
            return $this->errorResponse('Orden de pago no encontrada', 404);
        }
        
        return $this->successResponse(
            [ 
                "orden" => $orden,
                "monto_total" => $montoTotal,
                "encargado" => $encargado 
            ],
            'Orden de pago obtenida correctamente'
        );
    }
}
