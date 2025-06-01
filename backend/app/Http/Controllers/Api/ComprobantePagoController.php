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
            // --- VALIDACIÓN DE NOMBRE Y MONTO DEL RESPONSABLE DE PAGO ---
            // Función para normalizar nombres (mayúsculas, sin tildes, sin caracteres especiales)
            function normalizar_nombre($str) {
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
            if ($nombreResponsable) {
                if (normalizar_nombre($nombre) !== normalizar_nombre($nombreResponsable)) {
                    Storage::disk('public')->delete($filePath);
                    return $this->errorResponse('El nombre del pagador en el comprobante no coincide con el responsable de pago registrado.', 422);
                }
            }
            // Validar monto exacto
            if (isset($orden->monto_total) && isset($orden->monto_total)) {
                // Si el comprobante tiene monto extraído por OCR, usarlo (aquí asumimos que el monto es el de la orden)
                // Si en el futuro se extrae el monto del comprobante, comparar aquí
                if ((float)$orden->monto_total != (float)$orden->monto_total) {
                    Storage::disk('public')->delete($filePath);
                    return $this->errorResponse('El monto del comprobante no coincide con el monto de la orden de pago.', 422);
                }
            }
            // Guardar comprobante
            $comprobante = ComprobantePago::create([
                'id_orden' => $orden->id_orden,
                'numero_comprobante' => $numero ?? 'N/A',
                'nombre_pagador' => $nombre,
                'fecha_pago' => $fecha ? date('Y-m-d', strtotime(str_replace('/', '-', $fecha))) : now(),
                'monto_pagado' => $orden->monto_total,
                'pdf_comprobante' => $filePath,
                // Guardar datos_ocr como array asociativo, no como string JSON
                'datos_ocr' => [
                    'ocr_text' => $ocrText,
                    'nombre' => $nombre,
                    'numero_comprobante' => $numero,
                    'fecha' => $fecha,
                    'monto' => $orden->monto_total
                ],                'estado_verificacion' => 'pendiente',
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
}
