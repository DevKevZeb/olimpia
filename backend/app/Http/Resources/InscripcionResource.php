<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class InscripcionResource extends JsonResource
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
            'id' => $this->id_inscripcion,
            'id_estudiante' => $this->id_estudiante,
            'id_convocatoria_nivel' => $this->id_convocatoria_nivel,
            'id_tutor_academico' => $this->id_tutor_academico,
            'fecha_inscripcion' => $this->fecha_inscripcion,
            'estado' => $this->estado,
            'estudiante' => $this->whenLoaded('estudiante', function () {
                return new EstudianteResource($this->estudiante);
            }),
            'convocatoria_nivel' => $this->whenLoaded('convocatoriaNivel', function () {
                return new ConvocatoriaNivelResource($this->convocatoriaNivel);
            }),
            'tutor_academico' => $this->whenLoaded('tutorAcademico', function () {
                return new TutorAcademicoResource($this->tutorAcademico);
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
