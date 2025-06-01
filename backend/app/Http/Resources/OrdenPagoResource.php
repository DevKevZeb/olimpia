<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class OrdenPagoResource extends JsonResource
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
            'id' => $this->id_orden,            'codigo_unico' => $this->codigo_unico,
            'tipo_origen' => $this->tipo_origen,
            // Removed id_inscripcion since individual inscriptions are no longer supported
            'id_lista' => $this->id_lista,
            'monto_total' => $this->monto_total,
            'fecha_emision' => $this->fecha_emision,
            'fecha_vencimiento' => $this->fecha_vencimiento,            'estado' => $this->estado,
            // Removed inscripcion relationship since Inscripcion model was deleted
            // All orders now work exclusively with listas
            'lista' => $this->whenLoaded('lista', function() {
                return new ListaInscripcionResource($this->lista);
            }),
            'comprobantes' => $this->whenLoaded('comprobantes', function() {
                return ComprobantePagoResource::collection($this->comprobantes);
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
