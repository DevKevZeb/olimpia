<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ConvocatoriaAreaResource extends JsonResource
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
            'id' => $this->id_convocatoria_area,
            'id_convocatoria' => $this->id_convocatoria,
            'id_area' => $this->id_area,
            'costo_inscripcion' => $this->costo_inscripcion,
            'area' => $this->whenLoaded('area', function() {
                return new AreaCompetenciaResource($this->area);
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
