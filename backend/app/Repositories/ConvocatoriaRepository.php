<?php

namespace App\Repositories;

use App\Models\Convocatoria;
use Illuminate\Database\Eloquent\Collection;

class ConvocatoriaRepository
{
    /**
     * Obtiene convocatorias por estados específicos
     */
    public function obtenerPorEstados(array $estados): Collection
    {
        return Convocatoria::whereIn('estado', $estados)
            ->with(['areas.area'])
            ->get();
    }

    /**
     * Obtiene todas las convocatorias ordenadas por fecha de creación
     */
    public function obtenerTodasOrdenadas(): Collection
    {
        return Convocatoria::with(['areas.area'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Encuentra una convocatoria por ID
     */
    public function encontrarPorId(int $id): ?Convocatoria
    {
        return Convocatoria::find($id);
    }

    /**
     * Encuentra una convocatoria por ID con relaciones específicas
     */
    public function encontrarConRelaciones(int $id, array $relaciones = []): ?Convocatoria
    {
        $query = Convocatoria::query();
        
        if (!empty($relaciones)) {
            $query->with($relaciones);
        }
        
        return $query->find($id);
    }

    /**
     * Obtiene convocatorias que deben cerrarse automáticamente
     */
    public function obtenerParaCerrarAutomaticamente(): Collection
    {
        return Convocatoria::paraCerrarAutomaticamente()->get();
    }
}
