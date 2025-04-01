<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ListaInscripcionResource extends JsonResource
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
            'id' => $this->id_lista,
            'codigo_lista' => $this->codigo_lista,
            'id_unidad_educativa' => $this->id_unidad_educativa,
            'fecha_creacion' => $this->fecha_creacion,
            'unidad_educativa' => $this->whenLoaded('unidadEducativa', function() {
                return new UnidadEducativaResource($this->unidadEducativa);
            }),
            'detalles' => $this->whenLoaded('detalles', function() {
                return DetalleListaInscripcionResource::collection($this->detalles);
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
