<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Convocatoria;
use Illuminate\Http\JsonResponse;

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
        $convocatoria = Convocatoria::where('estado', 'abierta')
            ->with([
                'areas.area', // Áreas de competencia con sus detalles
                'niveles.nivel.gradoMin', // Niveles con sus grados mínimos
                'niveles.nivel.gradoMax', // Niveles con sus grados máximos
            ])
            ->latest()
            ->first();

        if (!$convocatoria) {
            // Si no hay convocatoria abierta, buscar la última planificada
            $convocatoria = Convocatoria::where('estado', 'planificada')
                ->with([
                    'areas.area',
                    'niveles.nivel.gradoMin',
                    'niveles.nivel.gradoMax',
                ])
                ->latest()
                ->first();
        }

        if (!$convocatoria) {
            return $this->errorResponse('No hay convocatorias disponibles actualmente', 404);
        }

        // Obtener estadísticas básicas
        $estadisticas = [
            'total_inscritos' => $this->getTotalInscritos($convocatoria->id_convocatoria),
            'areas_participantes' => $convocatoria->areas->count(),
            'dias_restantes' => $this->getDiasRestantes($convocatoria->fecha_fin_inscripcion),
        ];

        return $this->successResponse([
            'convocatoria' => $convocatoria,
            'estadisticas' => $estadisticas
        ], 'Convocatoria actual obtenida correctamente');
    }

    /**
     * Calcula el total de estudiantes inscritos en una convocatoria
     * 
     * @param int $convocatoriaId
     * @return int
     */
    private function getTotalInscritos(int $convocatoriaId): int
    {
        return \App\Models\Inscripcion::whereHas('convocatoriaArea', function($query) use ($convocatoriaId) {
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
