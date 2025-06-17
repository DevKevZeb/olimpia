<?php

namespace App\Services;

use App\Models\ComprobantePago;
use App\Models\OrdenPago;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Services\PdfParserService; 

class ComprobantePagoService
{
    protected $pdfParserService;

    public function __construct(PdfParserService $pdfParserService)
    {
        $this->pdfParserService = $pdfParserService;
    }

    public function createComprobanteFromPdf(string $codigoOrden, UploadedFile $pdfFile): ComprobantePago
    {
        return DB::transaction(function () use ($codigoOrden, $pdfFile) {
            $orden = OrdenPago::where('codigo_unico', $codigoOrden)->firstOrFail();

            // Validaciones de estado de la orden (movidas desde el controlador)
            if ($orden->estado === 'pagada') {
                throw new \Exception('Esta orden de pago ya ha sido pagada.');
            }
            if ($orden->estado === 'vencida') {
                throw new \Exception('Esta orden de pago está vencida.');
            }
            if ($orden->comprobantes()->where('estado_verificacion', 'pendiente')->exists()) {
                throw new \Exception('Esta orden ya tiene un comprobante pendiente de verificación.');
            }

            // Guardar el archivo PDF
            $filePath = $pdfFile->store('comprobantes', 'public');

            // Extraer datos del PDF usando el servicio dedicado
            $extractedData = $this->pdfParserService->extractDataFromReceiptPdf(
                Storage::disk('public')->path($filePath)
            );

            // Validaciones de datos extraídos (movidas desde el controlador)
            $this->validateExtractedData($extractedData, $orden);

            // Crear el comprobante
            $comprobante = ComprobantePago::create([
                'id_orden' => $orden->id_orden,
                'numero_comprobante' => $extractedData['numero_recibo'],
                'nombre_pagador' => $extractedData['nombre_pagador'],
                'fecha_pago' => $extractedData['fecha_pago'],
                'monto_pagado' => $extractedData['monto_total'],
                'pdf_comprobante' => $filePath,
                'datos_ocr' => $extractedData, // Guardar todos los datos extraídos
                'estado_verificacion' => 'pendiente',
            ]);

            // Actualizar el estado de la orden
            $orden->update(['estado' => 'pagada']);

            return $comprobante;
        });
    }

    private function validateExtractedData(array $extractedData, OrdenPago $orden)
    {
        // Toda la lógica de validación del OCR y coincidencia con la orden
        // Código de inscripción, nombre del pagador, monto exacto.
        // Si falla, lanzar excepciones significativas que el controlador pueda capturar.

        // Ejemplo:
        if (strtoupper($extractedData['codigo_inscripcion_extraido']) !== strtoupper($orden->codigo_unico)) {
            Storage::disk('public')->delete($extractedData['pdf_path_temp']); // Asegúrate de limpiar si falla aquí
            throw new \Exception('El recibo no pertenece al código de inscripción proporcionado.');
        }
        // ... otras validaciones ...
    }

    public function updateComprobante(ComprobantePago $comprobante, array $data, ?\Illuminate\Http\UploadedFile $pdfFile = null): ComprobantePago
    {
        return DB::transaction(function () use ($comprobante, $data, $pdfFile) {
            // Manejo de archivo PDF
            if ($pdfFile) {
                if ($comprobante->pdf_comprobante) {
                    Storage::disk('public')->delete($comprobante->pdf_comprobante);
                }
                $data['pdf_comprobante'] = $pdfFile->store('comprobantes', 'public');
            }

            $wasVerified = array_key_exists('estado_verificacion', $data) &&
                           $data['estado_verificacion'] === 'verificado' &&
                           $comprobante->estado_verificacion !== 'verificado';

            $comprobante->update($data);

            if ($wasVerified) {
                $orden = $comprobante->orden;
                if ($orden) { // Asegúrate de que la orden exista
                    $orden->update(['estado' => 'pagada']);
                    // Si processListRegistrations hace algo, debería llamarse desde aquí
                    // $this->processListRegistrations($orden->lista); // Llamar a un método aquí si es necesario
                }
            }
            return $comprobante->fresh('orden'); // Retorna el modelo actualizado con la relación
        });
    }

    public function deleteComprobante(ComprobantePago $comprobante): bool
    {
        return DB::transaction(function () use ($comprobante) {
            // Validación de negocio
            if ($comprobante->estado_verificacion === 'verificado') {
                throw new \Exception('No se puede eliminar un comprobante de pago verificado', 409); // Usar un código de error personalizado si quieres
            }

            // Eliminar el archivo PDF
            if ($comprobante->pdf_comprobante) {
                Storage::disk('public')->delete($comprobante->pdf_comprobante);
            }

            return $comprobante->delete();
        });
    }
}