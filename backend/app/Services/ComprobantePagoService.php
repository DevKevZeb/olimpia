<?php

namespace App\Services;

use App\Exceptions\ComprobanteRechazadoException;
use App\Models\ComprobantePago;
use App\Models\OrdenPago;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

class ComprobantePagoService
{
    protected $pdfParserService;

    public function __construct(PdfParserService $pdfParserService)
    {
        $this->pdfParserService = $pdfParserService;
    }

    /**
     * Lee el recibo en PDF, comprueba que corresponda a la orden y, si todo
     * coincide, registra el comprobante como verificado y marca la orden como pagada.
     *
     * @throws ComprobanteRechazadoException si la orden no admite pagos o el recibo no coincide
     */
    public function createComprobanteFromPdf(string $codigoOrden, UploadedFile $pdfFile): ComprobantePago
    {
        $orden = OrdenPago::where('codigo_unico', $codigoOrden)->firstOrFail();
        $this->assertOrdenAdmitePago($orden);

        $filePath = $pdfFile->store('comprobantes', 'public');

        try {
            $extractedData = $this->pdfParserService->extractDataFromReceiptPdf(
                Storage::disk('public')->path($filePath)
            );
            $this->validateExtractedData($extractedData, $orden);

            return DB::transaction(function () use ($orden, $extractedData, $filePath) {
                $comprobante = ComprobantePago::create([
                    'id_orden' => $orden->id_orden,
                    'numero_comprobante' => $extractedData['numero_recibo'],
                    'nombre_pagador' => $extractedData['nombre_pagador'],
                    'fecha_pago' => $extractedData['fecha_pago'],
                    'monto_pagado' => $extractedData['monto_total'],
                    'pdf_comprobante' => $filePath,
                    'datos_ocr' => $extractedData,
                    'estado_verificacion' => 'verificado',
                ]);

                $orden->update(['estado' => 'pagada']);

                return $comprobante;
            });
        } catch (Throwable $e) {
            // El recibo no se registró: no se conserva el archivo subido
            Storage::disk('public')->delete($filePath);
            throw $e;
        }
    }

    private function assertOrdenAdmitePago(OrdenPago $orden): void
    {
        if ($orden->estado === 'pagada') {
            throw new ComprobanteRechazadoException('Esta orden de pago ya ha sido pagada.');
        }
        if ($orden->estado === 'vencida') {
            throw new ComprobanteRechazadoException('Esta orden de pago está vencida.');
        }
    }

    /**
     * Compara el código, el monto y el pagador del recibo con la orden.
     */
    private function validateExtractedData(array $extractedData, OrdenPago $orden): void
    {
        if (strtoupper($extractedData['codigo_inscripcion_extraido']) !== strtoupper($orden->codigo_unico)) {
            throw new ComprobanteRechazadoException('El recibo no pertenece al código de inscripción proporcionado.');
        }

        if ($extractedData['monto_total'] + 0.009 < (float) $orden->monto_total) {
            throw new ComprobanteRechazadoException(sprintf(
                'El monto del recibo (Bs %.2f) es menor al monto de la orden (Bs %.2f).',
                $extractedData['monto_total'],
                $orden->monto_total
            ));
        }

        $responsable = $orden->getNombreResponsablePago();
        if ($responsable && !$this->mismoPagador($extractedData['nombre_pagador'], $responsable)) {
            throw new ComprobanteRechazadoException('El nombre del pagador en el recibo no coincide con el responsable de pago de la orden.');
        }
    }

    /**
     * El recibo puede traer nombres y apellidos en cualquier orden y sin tildes;
     * se acepta si todas sus palabras pertenecen al nombre del responsable.
     */
    private function mismoPagador(string $nombreRecibo, string $nombreResponsable): bool
    {
        $recibo = array_unique(explode(' ', $this->pdfParserService->normalizeName($nombreRecibo)));
        $responsable = array_unique(explode(' ', $this->pdfParserService->normalizeName($nombreResponsable)));

        $minimoPalabras = min(2, count($responsable));

        return count($recibo) >= $minimoPalabras && empty(array_diff($recibo, $responsable));
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