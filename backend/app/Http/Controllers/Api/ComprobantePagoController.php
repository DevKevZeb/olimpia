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
use Smalot\PdfParser\Parser;

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
     * Sube un comprobante para una orden usando su código único
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function storeByCodigoOrden(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'codigo_orden' => 'required|string|exists:ordenes_pago,codigo_unico',
            'pdf_comprobante' => 'required|file|mimes:pdf|max:2048',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        try {
            DB::beginTransaction();
            $orden = OrdenPago::where('codigo_unico', $request->codigo_orden)->first();
            if (!$orden) {
                return $this->errorResponse('Orden de pago no encontrada', 404);
            }
            if ($orden->estado === 'pagada') {
                return $this->errorResponse('Esta orden de pago ya ha sido pagada', 422);
            }
            if ($orden->estado === 'vencida') {
                return $this->errorResponse('Esta orden de pago está vencida', 422);
            }
            if ($orden->comprobantes()->where('estado_verificacion', 'pendiente')->exists()) {
                return $this->errorResponse('Esta orden ya tiene un comprobante pendiente de verificación', 422);
            }
            // Guardar el archivo
            $file = $request->file('pdf_comprobante');
            $filePath = $file->store('comprobantes', 'public');
            // Extraer texto del PDF
            $pdfPath = storage_path('app/public/' . $filePath);
            $parser = new Parser();
            $pdf = $parser->parseFile($pdfPath);
            $ocrText = $pdf->getText();
            // Buscar datos por patrones
            $nombre = null;
            $numero = null;
            $fecha = null;
            if (preg_match('/Cliente:?[ \t]*([A-Za-zÁÉÍÓÚáéíóúñÑ ]+)/i', $ocrText, $m)) {
                $nombre = trim($m[1]);
            }
            // Extraer número de comprobante de forma robusta y flexible
            $numero = null;
            $lines = preg_split('/\r\n|\r|\n/', $ocrText);
            foreach ($lines as $i => $line) {
                // Busca variantes de "Comprobante n°: 04499856" (permite espacios, mayúsculas, minúsculas, n°/N°/Nº/No)
                if (preg_match('/Comprobante\s*n[°ºoO]?[\s:]*([0-9]{4,12})/iu', $line, $m)) {
                    $numero = trim($m[1]);
                    break;
                }
                // Si la línea contiene "Comprobante" y "n°" pero no el número, busca en la siguiente línea
                if (preg_match('/Comprobante\s*n[°ºoO]?[\s:]*$/iu', $line) && isset($lines[$i+1])) {
                    if (preg_match('/([0-9]{4,12})/', $lines[$i+1], $m)) {
                        $numero = trim($m[1]);
                        break;
                    }
                }
            }
            // Validar que el número sea obligatorio y solo dígitos (4 a 12 dígitos)
            if (!$numero || !preg_match('/^[0-9]{4,12}$/', $numero)) {
                Storage::disk('public')->delete($filePath);
                return $this->errorResponse('No se pudo extraer un número de comprobante válido. Asegúrese de subir un comprobante/factura válido.', 422);
            }
            if (preg_match('/Fecha:?\s*([0-9]{2}\/[0-9]{2}\/[0-9]{4})/i', $ocrText, $m)) {
                $fecha = $m[1];
            }
            // Validar que sea comprobante
            if (!$nombre || !$fecha || stripos($ocrText, 'comprobante') === false) {
                Storage::disk('public')->delete($filePath);
                return $this->errorResponse('El archivo no parece ser un comprobante de pago válido. Asegúrese de subir el documento correcto.', 422);
            }
            // Guardar comprobante
            $comprobante = ComprobantePago::create([
                'id_orden' => $orden->id_orden,
                'numero_comprobante' => $numero ?? 'N/A',
                'nombre_pagador' => $nombre,
                'fecha_pago' => $fecha ? date('Y-m-d', strtotime(str_replace('/', '-', $fecha))) : now(),
                'monto_pagado' => $orden->monto_total,
                'pdf_comprobante' => $filePath,
                'datos_ocr' => json_encode([
                    'ocr_text' => $ocrText,
                    'nombre' => $nombre,
                    'numero_comprobante' => $numero,
                    'fecha' => $fecha
                ]),
                'estado_verificacion' => 'pendiente',
            ]);
            $orden->update(['estado' => 'pagada']);
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
     * Verifica si existe una orden de pago con el código especificado
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function verificarCodigoOrden(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'codigo_orden' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }
        
        try {
            $orden = OrdenPago::where('codigo_unico', $request->codigo_orden)
                ->with(['inscripcion.estudiante', 'lista.unidadEducativa'])
                ->first();
                
            if (!$orden) {
                return $this->errorResponse('No se encontró una orden de pago con ese código', 404);
            }
            
            // Check if the order already has a payment receipt - More defensive coding
            $tieneComprobante = false;
            if (method_exists($orden, 'comprobantes')) {
                $tieneComprobante = $orden->comprobantes()->exists();
            }
            
            // Estructura de respuesta básica
            $response = [
                'orden' => [
                    'id' => $orden->id_orden,
                    'codigo_unico' => $orden->codigo_unico,
                    'monto_total' => $orden->monto_total,
                    'fecha_emision' => $orden->fecha_emision,
                    'fecha_vencimiento' => $orden->fecha_vencimiento,
                    'estado' => $orden->estado,
                    'tipo_origen' => $orden->tipo_origen,
                ],
                'tiene_comprobante' => $tieneComprobante,
            ];
            
            // Añadir información específica según el tipo de origen
            if ($orden->tipo_origen === 'individual' && $orden->inscripcion) {
                $estudiante = $orden->inscripcion->estudiante;
                if ($estudiante) {
                    $response['estudiante'] = [
                        'nombre_completo' => $estudiante->nombres . ' ' . $estudiante->apellidos,
                        'ci' => $estudiante->ci,
                    ];
                }
            } elseif ($orden->tipo_origen === 'lista' && $orden->lista) {
                if ($orden->lista->unidadEducativa) {
                    $response['unidad_educativa'] = $orden->lista->unidadEducativa->nombre;
                }
                
                // Count students safely
                $response['estudiantes_count'] = 0;
                if ($orden->lista->detalles) {
                    $response['estudiantes_count'] = $orden->lista->detalles->count();
                }
            }
            
            return $this->successResponse(
                $response,
                'Orden de pago encontrada'
            );
        } catch (\Exception $e) {
            return $this->errorResponse('Error al verificar el código: ' . $e->getMessage(), 500);
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
            // Check if the student is already registered for this nivel
            $existingRegistration = \App\Models\Inscripcion::where('id_estudiante', $detalle->id_estudiante)
                ->where('id_convocatoria_nivel', $detalle->id_convocatoria_nivel)
                ->first();
                
            if ($existingRegistration) {
                // Update the existing registration to verified
                $existingRegistration->update(['estado' => 'verificada']);
            } else {
                // Create a new verified registration
                \App\Models\Inscripcion::create([
                    'id_estudiante' => $detalle->id_estudiante,
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
