<?php

namespace App\Http\Controllers\Api;

use App\Models\ComprobantePago;
use App\Models\OrdenPago;
use Illuminate\Http\Request;
use App\Http\Resources\ComprobantePagoResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ComprobantePagoController extends ApiController
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = ComprobantePago::with(['orden']);
        
        // Filter by estado_verificacion if provided
        if ($request->has('estado_verificacion')) {
            $query->where('estado_verificacion', $request->estado_verificacion);
        }
        
        // Filter by orden_id if provided
        if ($request->has('orden_id')) {
            $query->where('id_orden', $request->orden_id);
        }
        
        $comprobantes = $query->paginate(15);
            
        return $this->successResponse(
            [
                'data' => ComprobantePagoResource::collection($comprobantes),
                'pagination' => [
                    'total' => $comprobantes->total(),
                    'per_page' => $comprobantes->perPage(),
                    'current_page' => $comprobantes->currentPage(),
                    'last_page' => $comprobantes->lastPage(),
                ]
            ],
            'Comprobantes de pago obtenidos correctamente'
        );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id_orden' => 'required|exists:ordenes_pago,id_orden',
            'numero_comprobante' => 'required|string|max:50',
            'nombre_pagador' => 'required|string|max:100',
            'fecha_pago' => 'required|date',
            'monto_pagado' => 'required|numeric|min:0',
            'pdf_comprobante' => 'required|file|mimes:pdf|max:2048',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        try {
            DB::beginTransaction();
            
            // Get the orden de pago
            $orden = OrdenPago::findOrFail($request->id_orden);
            
            // Check if the order is already paid
            if ($orden->estado === 'pagada') {
                return $this->errorResponse('Esta orden de pago ya ha sido pagada', 422);
            }
            
            // Check if the order is expired
            if ($orden->estado === 'vencida') {
                return $this->errorResponse('Esta orden de pago está vencida', 422);
            }
            
            // Check if the amount paid matches the total amount
            if ((float) $request->monto_pagado < (float) $orden->monto_total) {
                return $this->errorResponse('El monto pagado debe ser igual o mayor al monto total de la orden', 422);
            }
            
            // Store the PDF file
            $pdfPath = $request->file('pdf_comprobante')->store('comprobantes', 'public');
            
            // Create the comprobante
            $comprobante = ComprobantePago::create([
                'id_orden' => $request->id_orden,
                'numero_comprobante' => $request->numero_comprobante,
                'nombre_pagador' => $request->nombre_pagador,
                'fecha_pago' => $request->fecha_pago,
                'monto_pagado' => $request->monto_pagado,
                'pdf_comprobante' => $pdfPath,
                'datos_ocr' => null, // This would be filled by an OCR service if available
                'estado_verificacion' => 'pendiente',
            ]);
            
            // Update the orden status if automatic verification is enabled
            // For now, we'll mark it as paid directly for demonstration purposes
            $orden->update(['estado' => 'pagada']);
            
            // If the payment is for an individual registration, update the registration status
            if ($orden->tipo_origen === 'individual' && $orden->inscripcion) {
                $orden->inscripcion->update(['estado' => 'pagada']);
            }
            
            DB::commit();
            
            return $this->successResponse(
                new ComprobantePagoResource($comprobante->load('orden')),
                'Comprobante de pago registrado correctamente',
                201
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse('Error al registrar el comprobante de pago: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(int $id): JsonResponse
    {
        $comprobante = ComprobantePago::with(['orden.inscripcion.estudiante', 'orden.lista.unidadEducativa'])
            ->find($id);
        
        if (!$comprobante) {
            return $this->errorResponse('Comprobante de pago no encontrado', 404);
        }
        
        return $this->successResponse(
            new ComprobantePagoResource($comprobante),
            'Comprobante de pago obtenido correctamente'
        );
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $comprobante = ComprobantePago::find($id);
        
        if (!$comprobante) {
            return $this->errorResponse('Comprobante de pago no encontrado', 404);
        }
        
        $validator = Validator::make($request->all(), [
            'numero_comprobante' => 'sometimes|required|string|max:50',
            'nombre_pagador' => 'sometimes|required|string|max:100',
            'fecha_pago' => 'sometimes|required|date',
            'monto_pagado' => 'sometimes|required|numeric|min:0',
            'estado_verificacion' => 'sometimes|required|in:pendiente,verificado,rechazado',
            'pdf_comprobante' => 'sometimes|file|mimes:pdf|max:2048',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        try {
            DB::beginTransaction();
            
            $data = $request->except('pdf_comprobante');
            
            // Handle PDF file update if provided
            if ($request->hasFile('pdf_comprobante')) {
                // Delete the old file
                if ($comprobante->pdf_comprobante) {
                    Storage::disk('public')->delete($comprobante->pdf_comprobante);
                }
                
                // Store the new file
                $data['pdf_comprobante'] = $request->file('pdf_comprobante')->store('comprobantes', 'public');
            }
            
            // Check if the verification status is changing to 'verificado'
            $wasVerified = $request->has('estado_verificacion') && 
                           $request->estado_verificacion === 'verificado' && 
                           $comprobante->estado_verificacion !== 'verificado';
                           
            // Update the comprobante
            $comprobante->update($data);
            
            // If the comprobante was verified, update related records
            if ($wasVerified) {
                $orden = $comprobante->orden;
                
                // Update the orden status
                $orden->update(['estado' => 'pagada']);
                
                // Update inscriptions based on the order type
                if ($orden->tipo_origen === 'individual' && $orden->inscripcion) {
                    $orden->inscripcion->update(['estado' => 'verificada']);
                } elseif ($orden->tipo_origen === 'lista' && $orden->lista) {
                    // Process all students in the list
                    $this->processListRegistrations($orden->lista);
                }
            }
            
            DB::commit();
            
            return $this->successResponse(
                new ComprobantePagoResource($comprobante->fresh('orden')),
                'Comprobante de pago actualizado correctamente'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse('Error al actualizar el comprobante de pago: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(int $id): JsonResponse
    {
        $comprobante = ComprobantePago::find($id);
        
        if (!$comprobante) {
            return $this->errorResponse('Comprobante de pago no encontrado', 404);
        }
        
        // Don't allow deleting verified receipts
        if ($comprobante->estado_verificacion === 'verificado') {
            return $this->errorResponse('No se puede eliminar un comprobante de pago verificado', 409);
        }
        
        try {
            DB::beginTransaction();
            
            // Delete the PDF file
            if ($comprobante->pdf_comprobante) {
                Storage::disk('public')->delete($comprobante->pdf_comprobante);
            }
            
            $comprobante->delete();
            
            DB::commit();
            
            return $this->successResponse(
                null,
                'Comprobante de pago eliminado correctamente'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse('Error al eliminar el comprobante de pago: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Process registrations from a list
     * This creates individual registrations for each student in the list
     */
    private function processListRegistrations($lista)
    {
        foreach ($lista->detalles as $detalle) {
            // Check if the student is already registered for this area
            $existingRegistration = \App\Models\Inscripcion::where('id_estudiante', $detalle->id_estudiante)
                ->where('id_convocatoria_area', $detalle->id_convocatoria_area)
                ->first();
                
            if ($existingRegistration) {
                // Update the existing registration to verified
                $existingRegistration->update(['estado' => 'verificada']);
            } else {
                // Create a new verified registration
                \App\Models\Inscripcion::create([
                    'id_estudiante' => $detalle->id_estudiante,
                    'id_convocatoria_area' => $detalle->id_convocatoria_area,
                    'id_convocatoria_nivel' => $detalle->id_convocatoria_nivel,
                    'id_tutor_academico' => $detalle->id_tutor_academico,
                    'fecha_inscripcion' => now(),
                    'estado' => 'verificada',
                ]);
            }
        }
    }
    
    /**
     * Download PDF receipt
     */
    public function downloadPdf(int $id): JsonResponse
    {
        $comprobante = ComprobantePago::find($id);
        
        if (!$comprobante) {
            return $this->errorResponse('Comprobante de pago no encontrado', 404);
        }
        
        if (!$comprobante->pdf_comprobante || !Storage::disk('public')->exists($comprobante->pdf_comprobante)) {
            return $this->errorResponse('El archivo PDF no existe', 404);
        }
        
        $url = url(Storage::url($comprobante->pdf_comprobante));
        
        return $this->successResponse(
            ['url' => $url],
            'URL del PDF generada correctamente'
        );
    }
}
