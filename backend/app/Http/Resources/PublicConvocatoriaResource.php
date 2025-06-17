<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class PublicConvocatoriaResource extends JsonResource
{
    /**
     * Transforma la convocatoria y sus estadísticas para la respuesta JSON.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function toArray($request): array
    {
        return [
            'id' => $this->id_convocatoria,
            'nombre' => $this->nombre,
            'estado' => $this->estado,
            'fecha_inicio_inscripcion' => $this->fecha_inicio_inscripcion,
            'fecha_fin_inscripcion' => $this->fecha_fin_inscripcion,
            'max_areas_por_estudiante' => $this->max_areas_por_estudiante,
            // Incluir relaciones cargadas. Puedes usar Resources anidados si son más complejos.
            'areas' => ConvocatoriaAreaResource::collection($this->whenLoaded('areas')), // Asumiendo que tienes ConvocatoriaAreaResource
            'niveles' => ConvocatoriaNivelResource::collection($this->whenLoaded('niveles')), // Asumiendo ConvocatoriaNivelResource
            'estadisticas' => [
                'total_inscritos' => $this->total_inscritos, // Accede al Accessor
                'areas_participantes' => $this->areas->count(), // Ya está bien aquí
                'dias_restantes' => $this->dias_restantes, // Accede al Accessor
            ],
        ];
    }
}