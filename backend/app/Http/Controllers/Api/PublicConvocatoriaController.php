<?php

namespace App\Http\Controllers\Api;

use App\Models\Convocatoria;
use Illuminate\Http\JsonResponse;

use App\Http\Resources\PublicConvocatoriaResource;

class PublicConvocatoriaController extends ApiController
{
    /**
     * Obtiene la convocatoria actual con todas sus áreas y detalles relacionados
     * 
     * @return JsonResponse
     */
    public function getConvocatoriaActual(): JsonResponse
    {
        // Buscar la convocatoria activa (con estado "abierta")
        $convocatoria = Convocatoria::currentOrPlanned()
            ->with([
                'areas.area',
                'niveles.nivel.gradoMin',
                'niveles.nivel.gradoMax',
            ])
            ->first();
        
        if (!$convocatoria) {
            return $this->errorResponse('No hay convocatorias disponibles actualmente', 404);
        }

        return $this->successResponse(
            new PublicConvocatoriaResource($convocatoria),
            'Convocatoria actual obtenida correctamente'
        );
    }

    /**
     * Calcula el total de estudiantes inscritos en una convocatoria
     * 
     * @param int $convocatoriaId
     * @return int
     */
    private function getTotalInscritos(int $convocatoriaId): int
    {
        return \App\Models\DetallesListaInscripcion::whereHas('convocatoriaArea', function($query) use ($convocatoriaId) {
            $query->where('id_convocatoria', $convocatoriaId);
        })->count();
    }

    /**
     * Calcula los días restantes hasta la fecha de fin de inscripción
     * 
     * @param string $fechaFin
     * @return int
     */
    private function getDiasRestantes(string $fechaFin): int
    {
        $hoy = now();
        $fechaFin = \Carbon\Carbon::parse($fechaFin);
        
        if ($fechaFin->isPast()) {
            return 0;
        }
        
        return $hoy->diffInDays($fechaFin);
    }
}
