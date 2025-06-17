<?php
namespace App\Http\Resources;
use Illuminate\Http\Resources\Json\JsonResource;
class RequisitoConvocatoriaResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id_requisito, // Asumiendo 'id_requisito' es la PK
            'id_convocatoria' => $this->id_convocatoria,
            'entidad' => $this->entidad,
            'campo' => $this->campo,
            'es_obligatorio' => (bool) $this->es_obligatorio,
            // Añade otros campos si los necesitas
        ];
    }
}