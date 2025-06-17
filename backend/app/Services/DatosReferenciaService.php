<?php

namespace App\Services;

use App\Models\AreaCompetencia;
use App\Models\NivelCategoria;
use App\Models\Grado;
use Illuminate\Database\Eloquent\Collection;

class DatosReferenciaService
{
    /**
     * Obtiene todas las áreas de competencia
     */
    public function obtenerAreasCompetencia(): Collection
    {
        return AreaCompetencia::all();
    }

    /**
     * Obtiene todos los niveles de categoría
     */
    public function obtenerNivelesCategoria(): Collection
    {
        return NivelCategoria::all();
    }

    /**
     * Obtiene todos los grados ordenados
     */
    public function obtenerGrados(): Collection
    {
        return Grado::orderBy('orden')->get();
    }

    /**
     * Obtiene todos los datos de referencia en un solo array
     */
    public function obtenerTodosDatosReferencia(): array
    {
        return [
            'areas_competencia' => $this->obtenerAreasCompetencia(),
            'niveles_categoria' => $this->obtenerNivelesCategoria(),
            'grados' => $this->obtenerGrados(),
        ];
    }
}
