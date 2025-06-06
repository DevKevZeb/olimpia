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
            
            // Note: Individual inscriptions are no longer supported since Inscripcion model was deleted
            // All registrations now go through detalles_lista_inscripcion
            
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
            }            // Guardar el archivo
            $file = $request->file('pdf_comprobante');
            $filePath = $file->store('comprobantes', 'public');
            
            // Extraer texto del PDF - normalize path separators for Windows compatibility
            $normalizedFilePath = str_replace('/', DIRECTORY_SEPARATOR, $filePath);
            $pdfPath = storage_path('app' . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . $normalizedFilePath);
            $parser = new Parser();
            $pdf = $parser->parseFile($pdfPath);
            $ocrText = $pdf->getText();
            
            // Buscar datos específicos del nuevo formato de recibo
            $numero = null;
            $fecha = null;
            $nombre = null;
            $monto = null;
            $aclaracion = null;
            $codigoInscripcion = null;
            
            // Extraer Nro. del recibo
            if (preg_match('/Nro\.?\s*:?\s*([0-9]+)/i', $ocrText, $m)) {
                $numero = trim($m[1]);
            }
              // Extraer fecha (formato DD-MM-YY HH:MM)
            if (preg_match('/Fecha:\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4}(?:\s+[0-9]{1,2}:[0-9]{2})?)/i', $ocrText, $m)) {
                $fecha = trim($m[1]);
            }
              // Extraer nombre del pagador "Recibí de:" - patrón exacto
            if (preg_match('/Recibí de:\s*([^\n\r]+)/i', $ocrText, $m)) {
                $nombre = trim($m[1]);
            }            // Extraer monto "Total:" - patrón mejorado más robusto
            if (preg_match('/Total[:\s]*.*?(\d+(?:[.,]\d{1,2})?)/i', $ocrText, $m)) {
                $monto = str_replace(',', '.', trim($m[1]));
            }
              // Extraer aclaración completa - patrón exacto
            if (preg_match('/Aclaración:\s*([^\n\r]+)/i', $ocrText, $m)) {
                $aclaracion = trim($m[1]);
                
                // Buscar código de inscripción en la aclaración (formato: O-SANSI-2025-XXXXX)
                if (preg_match('/(O-SANSI-\d{4}-\d+)/i', $aclaracion, $cm)) {
                    $codigoInscripcion = trim($cm[1]);
                }
            }
            
            // Validaciones básicas del documento
            if (!$numero) {
                Storage::disk('public')->delete($filePath);
                return $this->errorResponse('No se pudo extraer el número del recibo. Asegúrese de que el documento contenga el campo "Nro."', 422);
            }
            
            if (!$fecha) {
                Storage::disk('public')->delete($filePath);
                return $this->errorResponse('No se pudo extraer la fecha del recibo. Asegúrese de que el documento contenga el campo "Fecha:"', 422);
            }
            
            if (!$nombre) {
                Storage::disk('public')->delete($filePath);
                return $this->errorResponse('No se pudo extraer el nombre del pagador. Asegúrese de que el documento contenga el campo "Recibí de:"', 422);
            }
              if (!$monto) {
                Storage::disk('public')->delete($filePath);
                
                // Debug: buscar líneas que contengan "total" para ayudar con el diagnóstico
                $lineasConTotal = [];
                $lines = explode("\n", $ocrText);
                foreach ($lines as $lineNum => $line) {
                    if (preg_match('/total/i', trim($line))) {
                        $lineasConTotal[] = "Línea " . ($lineNum + 1) . ": \"" . trim($line) . "\"";
                    }
                }
                
                $debugInfo = empty($lineasConTotal) 
                    ? "No se encontraron líneas que contengan 'Total' en el documento."
                    : "Líneas encontradas con 'Total': " . implode("; ", $lineasConTotal);
                
                return $this->errorResponse('No se pudo extraer el monto total. Asegúrese de que el documento contenga el campo "Total:". ' . $debugInfo, 422);
            }
              if (!$aclaracion) {
                Storage::disk('public')->delete($filePath);
                
                // Debug: buscar líneas que contengan "aclaración"
                $lineasConAclaracion = [];
                $lines = explode("\n", $ocrText);
                foreach ($lines as $lineNum => $line) {
                    if (preg_match('/aclaraci[óo]n/i', trim($line))) {
                        $lineasConAclaracion[] = "Línea " . ($lineNum + 1) . ": \"" . trim($line) . "\"";
                    }
                }
                
                $debugInfo = empty($lineasConAclaracion) 
                    ? "No se encontraron líneas que contengan 'Aclaración' en el documento."
                    : "Líneas encontradas con 'Aclaración': " . implode("; ", $lineasConAclaracion);
                
                return $this->errorResponse('No se pudo extraer la aclaración del recibo. Asegúrese de que el documento contenga el campo "Aclaración:". ' . $debugInfo, 422);
            }
            
            if (!$codigoInscripcion) {
                Storage::disk('public')->delete($filePath);
                return $this->errorResponse('No se encontró un código de inscripción válido en la aclaración. El código debe tener el formato O-SANSI-YYYY-XXXXX', 422);
            }
            
            // Validar que el código de inscripción extraído coincida con el código de la orden
            if (strtoupper($codigoInscripcion) !== strtoupper($orden->codigo_unico)) {
                Storage::disk('public')->delete($filePath);
                return $this->errorResponse('El código de inscripción en la aclaración del recibo no coincide con el código de la orden de pago.', 422);
            }            // --- VALIDACIÓN DE NOMBRE Y MONTO DEL RESPONSABLE DE PAGO ---
            
            // Obtener nombre responsable de pago
            $nombreResponsable = null;
            if ($orden->tipo_origen === 'lista' && $orden->id_lista) {
                $encargado = \App\Models\EncargadoPago::where('id_lista', $orden->id_lista)->first();
                if ($encargado) {
                    $nombreResponsable = trim($encargado->nombres . ' ' . $encargado->apellidos);
                }
            } elseif ($orden->tipo_origen === 'individual') {
                $nombreResponsable = $orden->encargado_nombre ?? null;
            }
            
            // Validar nombre del pagador (si hay responsable registrado)
            if ($nombreResponsable) {
                if ($this->normalizarNombre($nombre) !== $this->normalizarNombre($nombreResponsable)) {
                    Storage::disk('public')->delete($filePath);
                    return $this->errorResponse('El nombre del pagador en el recibo ("' . $nombre . '") no coincide con el responsable de pago registrado ("' . $nombreResponsable . '").', 422);
                }
            }
            
            // Validar monto exacto con el monto de la orden
            $montoOrden = (float)$orden->monto_total;
            $montoRecibo = (float)$monto;
            
            if (abs($montoOrden - $montoRecibo) > 0.01) { // Permitir diferencia de 1 centavo por redondeo
                Storage::disk('public')->delete($filePath);
                return $this->errorResponse('El monto del recibo (Bs. ' . number_format($montoRecibo, 2) . ') no coincide con el monto de la orden de pago (Bs. ' . number_format($montoOrden, 2) . ').', 422);
            }            // Guardar comprobante con los datos extraídos del nuevo formato
            $comprobante = ComprobantePago::create([
                'id_orden' => $orden->id_orden,
                'numero_comprobante' => $numero,
                'nombre_pagador' => $nombre,
                'fecha_pago' => $fecha ? date('Y-m-d', strtotime(str_replace('/', '-', $fecha))) : now(),
                'monto_pagado' => $montoRecibo,
                'pdf_comprobante' => $filePath,                // Guardar todos los datos extraídos del OCR
                'datos_ocr' => [
                    'ocr_text' => $ocrText,
                    'numero_recibo' => $numero,
                    'fecha' => $fecha,
                    'nombre_pagador' => $nombre,
                    'monto_total' => $monto,
                    'aclaracion' => $aclaracion,
                    'codigo_inscripcion_extraido' => $codigoInscripcion,
                    'codigo_orden_validado' => $orden->codigo_unico
                ],'estado_verificacion' => 'pendiente',
            ]);
            $orden->update(['estado' => 'pagada']);
            
            // Note: Individual inscriptions are no longer supported since Inscripcion model was deleted
            // All registrations now go through detalles_lista_inscripcion
            
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
        }          try {
            $orden = OrdenPago::where('codigo_unico', $request->codigo_orden)
                ->with(['lista']) // Removido .unidadEducativa del eager loading
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
            if ($orden->tipo_origen === 'individual' && $orden->lista) {
                // Para inscripciones individuales, buscar el primer estudiante en la lista
                $primerDetalle = $orden->lista->detalles()->with('estudiante')->first();
                if ($primerDetalle && $primerDetalle->estudiante) {
                    $response['estudiante'] = [
                        'nombre_completo' => $primerDetalle->estudiante->nombres . ' ' . $primerDetalle->estudiante->apellidos,
                        'ci' => $primerDetalle->estudiante->ci,
                    ];
                }            } elseif ($orden->tipo_origen === 'lista' && $orden->lista) {
                $unidadEducativa = $orden->lista->unidadEducativa(); // Acceso directo al método
                if ($unidadEducativa) {
                    $response['unidad_educativa'] = $unidadEducativa->nombre;
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
     */    public function show(int $id): JsonResponse
    {
        // Updated to remove obsolete inscripcion relationship since Inscripcion model was deleted
        $comprobante = ComprobantePago::with(['orden.lista']) // Removido .unidadEducativa del eager loading
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
                // Note: Individual inscriptions are no longer supported since Inscripcion model was deleted
                if ($orden->tipo_origen === 'lista' && $orden->lista) {
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
     * Since we no longer use individual inscriptions and everything is handled via listas_inscripcion,
     * we just need to mark the list details as verified (this could be handled at lista level if needed)
     */
    private function processListRegistrations($lista)
    {
        // Since all registrations are now handled via listas_inscripcion table,
        // and students are already registered in the lista detalles,
        // we don't need to create individual inscriptions anymore.
        // The verification status is handled at the orden/comprobante level.
        
        // If we need to track verification status per student in the future,
        // we could add a 'estado' column to detalles_lista_inscripcion table
        // For now, the payment verification at orden level is sufficient
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
    
    /**
     * Normalizar nombres para comparación (mayúsculas, sin tildes, sin caracteres especiales)
     * 
     * @param string $str
     * @return string
     */
    private function normalizarNombre($str)
    {
        $str = mb_strtoupper($str, 'UTF-8');
        $str = preg_replace('/[áàäâ]/iu', 'A', $str);
        $str = preg_replace('/[éèëê]/iu', 'E', $str);
        $str = preg_replace('/[íìïî]/iu', 'I', $str);
        $str = preg_replace('/[óòöô]/iu', 'O', $str);
        $str = preg_replace('/[úùüû]/iu', 'U', $str);
        $str = preg_replace('/[^A-Z ]/', '', $str);
        $str = preg_replace('/\s+/', ' ', $str);
        return trim($str);
    }
}
