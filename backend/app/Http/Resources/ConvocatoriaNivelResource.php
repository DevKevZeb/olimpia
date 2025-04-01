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
            'id_convocatoria' => $this->id_convocatoria,
            'id_nivel' => $this->id_nivel,
            'nivel' => $this->whenLoaded('nivel', function() {
                return new NivelCategoriaResource($this->nivel);
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
