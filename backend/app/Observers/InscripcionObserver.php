<?php

namespace App\Observers;

use App\Models\Inscripcion;

class InscripcionObserver
{
    public function creating(Inscripcion $inscripcion)
    {
        $convocatoriaArea = $inscripcion->convocatoriaArea;
        $convocatoria = $convocatoriaArea->convocatoria;
        
        $areasInscritas = Inscripcion::where('id_estudiante', $inscripcion->id_estudiante)
            ->whereHas('convocatoriaArea', function($query) use ($convocatoria) {
                $query->where('id_convocatoria', $convocatoria->id_convocatoria);
            })
            ->count();
            
        if ($areasInscritas >= $convocatoria->max_areas_por_estudiante) {
            throw new \Exception("Límite de áreas alcanzado (Máximo: {$convocatoria->max_areas_por_estudiante})");
        }
    }
}