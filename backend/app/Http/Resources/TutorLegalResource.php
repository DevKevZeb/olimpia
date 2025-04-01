<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class TutorLegalResource extends JsonResource
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
            'id' => $this->id_tutor_legal,
            'nombres' => $this->nombres,
            'apellidos' => $this->apellidos,
            'ci' => $this->ci,
            'telefono' => $this->telefono,
            'email' => $this->email,
            'parentesco' => $this->parentesco,
            'es_el_mismo_estudiante' => (bool) $this->es_el_mismo_estudiante,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
