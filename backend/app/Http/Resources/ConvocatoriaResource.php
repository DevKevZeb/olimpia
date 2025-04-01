<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ConvocatoriaResource extends JsonResource
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
            'id' => $this->id_convocatoria,
            'nombre' => $this->nombre,
            'fecha_inicio_inscripcion' => $this->fecha_inicio_inscripcion,
            'fecha_fin_inscripcion' => $this->fecha_fin_inscripcion,
            'max_areas_por_estudiante' => $this->max_areas_por_estudiante,
            'estado' => $this->estado,
            'areas' => $this->whenLoaded('areas', function() {
                return ConvocatoriaAreaResource::collection($this->areas);
            }),
            'niveles' => $this->whenLoaded('niveles', function() {
                return ConvocatoriaNivelResource::collection($this->niveles);
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
