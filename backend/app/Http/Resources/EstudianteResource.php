<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class EstudianteResource extends JsonResource
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
            'id' => $this->id_estudiante,
            'nombres' => $this->nombres,
            'apellidos' => $this->apellidos,
            'nombre_completo' => $this->nombres . ' ' . $this->apellidos,
            'ci' => $this->ci,
            'fecha_nacimiento' => $this->fecha_nacimiento,
            'email' => $this->email,
            'id_unidad_educativa' => $this->id_unidad_educativa,
            'id_grado' => $this->id_grado,
            'id_tutor_legal' => $this->id_tutor_legal,
            'unidad_educativa' => $this->whenLoaded('unidadEducativa', function() {
                return new UnidadEducativaResource($this->unidadEducativa);
            }),
            'grado' => $this->whenLoaded('grado', function() {
                return new GradoResource($this->grado);
            }),
            'tutor_legal' => $this->whenLoaded('tutorLegal', function() {
                return new TutorLegalResource($this->tutorLegal);
            }),
            'inscripciones' => $this->whenLoaded('inscripciones', function() {
                return InscripcionResource::collection($this->inscripciones);
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
