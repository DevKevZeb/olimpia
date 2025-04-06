<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ConvocatoriaNivelResource extends JsonResource
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
            'id' => $this->id_convocatoria_nivel,
            'id_convocatoria_area' => $this->id_convocatoria_area,
            'id_nivel' => $this->id_nivel,
            'id_grado_min' => $this->id_grado_min,
            'id_grado_max' => $this->id_grado_max,
            'convocatoria_area' => $this->whenLoaded('convocatoriaArea', function () {
                return new ConvocatoriaAreaResource($this->convocatoriaArea);
            }),
            'nivel' => $this->whenLoaded('nivel', function () {
                return new NivelCategoriaResource($this->nivel);
            }),
            'grado_min' => $this->whenLoaded('gradoMin', function () {
                return $this->gradoMin;
            }),
            'grado_max' => $this->whenLoaded('gradoMax', function () {
                return $this->gradoMax;
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
