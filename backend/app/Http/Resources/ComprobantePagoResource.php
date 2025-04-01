<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class ComprobantePagoResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function toArray($request)
    {
        return [
            'id' => $this->id_comprobante,
            'id_orden' => $this->id_orden,
            'numero_comprobante' => $this->numero_comprobante,
            'nombre_pagador' => $this->nombre_pagador,
            'fecha_pago' => $this->fecha_pago,
            'monto_pagado' => $this->monto_pagado,
            'pdf_url' => $this->pdf_comprobante ? url(Storage::url($this->pdf_comprobante)) : null,
            'datos_ocr' => $this->datos_ocr,
            'estado_verificacion' => $this->estado_verificacion,
            'orden' => $this->whenLoaded('orden', function() {
                return new OrdenPagoResource($this->orden);
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
