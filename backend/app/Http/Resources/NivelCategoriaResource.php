<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class NivelCategoriaResource extends JsonResource
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
            'id' => $this->id_nivel,
            'nombre_nivel' => $this->nombre_nivel,
            'id_area' => $this->id_area,
            'id_grado_min' => $this->id_grado_min,
            'id_grado_max' => $this->id_grado_max,
            'area' => $this->whenLoaded('area', function() {
                return new AreaCompetenciaResource($this->area);
            }),
            'grado_min' => $this->whenLoaded('gradoMin', function() {
                return new GradoResource($this->gradoMin);
            }),
            'grado_max' => $this->whenLoaded('gradoMax', function() {
                return new GradoResource($this->gradoMax);
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
