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
use App\Http\Requests\StoreComprobanteByCodigoOrdenRequest;
use App\Services\ComprobantePagoService;
use App\Http\Requests\StoreComprobantePagoRequest; 
use App\Http\Requests\VerificarCodigoOrdenRequest;

class ComprobantePagoController extends ApiController
{
    protected $comprobantePagoService;
    public function __construct(ComprobantePagoService $comprobantePagoService)
    {
        $this->comprobantePagoService = $comprobantePagoService;
    }
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $comprobantes = ComprobantePago::with(['orden'])
        ->whereEstadoVerificacion($request->input('estado_verificacion'))
        ->whereOrdenId($request->input('orden_id'))
        ->paginate(15);
                    
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
    public function store(StoreComprobantePagoRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();
            
            // Get the orden de pago
            $orden = OrdenPago::findOrFail($request->id_orden);
            
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
    public function storeByCodigoOrden(StoreComprobanteByCodigoOrdenRequest $request): JsonResponse
    {
        try {
            $comprobante = $this->comprobantePagoService->createComprobanteFromPdf(
                $request->codigo_orden,
                $request->file('pdf_comprobante')
            );

            return $this->successResponse(
                new ComprobantePagoResource($comprobante->load('orden')),
                'Comprobante de pago registrado correctamente',
                201
            );
        } catch (\Exception $e) {
            // Aquí podrías tener lógica más fina para diferentes tipos de excepciones
            return $this->errorResponse($e->getMessage(), 422); // O 500 si es un error interno
        }
    }
    
    /**
     * Verifica si existe una orden de pago con el código especificado
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function verificarCodigoOrden(VerificarCodigoOrdenRequest $request): JsonResponse
    {
        try {
            $orden = OrdenPago::where('codigo_unico', $request->codigo_orden)
                ->with(['lista.detalles.estudiante.unidadEducativa','comprobantes']) 
                ->firstOrFail(); 

            $responseData = $orden->getVerificationDetails();

            return $this->successResponse(
                $responseData,
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

        try {
            $updatedComprobante = $this->comprobantePagoService->updateComprobante(
                $comprobante,
                $request->except('pdf_comprobante'), // Pasa los datos, excepto el archivo
                $request->file('pdf_comprobante') // Pasa el archivo si existe
            );

            return $this->successResponse(
                new ComprobantePagoResource($updatedComprobante),
                'Comprobante de pago actualizado correctamente'
            );
        } catch (\Exception $e) {
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
        
        try {
            $this->comprobantePagoService->deleteComprobante($comprobante);

            return $this->successResponse(
                null,
                'Comprobante de pago eliminado correctamente'
            );
        } catch (\Exception $e) {
            // Captura el código de error 409 si lo lanzaste desde el servicio
            $statusCode = ($e->getCode() === 409) ? 409 : 500;
            return $this->errorResponse('Error al eliminar el comprobante de pago: ' . $e->getMessage(), $statusCode);
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
