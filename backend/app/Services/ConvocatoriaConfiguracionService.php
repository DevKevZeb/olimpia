<?php

namespace App\Services;

use App\Models\Convocatoria;
use App\Models\ConvocatoriaArea;
use App\Models\ConvocatoriaNivel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ConvocatoriaConfiguracionService
{
    /**
     * Asocia áreas a una convocatoria
     */
    public function asociarAreas(int $idConvocatoria, array $areas): Convocatoria
    {
        return DB::transaction(function () use ($idConvocatoria, $areas) {
            try {
                foreach ($areas as $areaData) {
                    $this->procesarArea($idConvocatoria, $areaData);
                }

                Log::info('Áreas asociadas exitosamente', [
                    'convocatoria_id' => $idConvocatoria,
                    'areas_count' => count($areas)
                ]);

                // Retornar convocatoria actualizada con relaciones
                return Convocatoria::with(['areas.area'])->findOrFail($idConvocatoria);
            } catch (\Exception $e) {
                Log::error('Error al asociar áreas', [
                    'convocatoria_id' => $idConvocatoria,
                    'error' => $e->getMessage()
                ]);
                throw $e;
            }
        });
    }

    /**
     * Asocia niveles y grados a las áreas de una convocatoria
     */
    public function asociarNivelesGrados(int $idConvocatoria, array $niveles): bool
    {
        return DB::transaction(function () use ($idConvocatoria, $niveles) {
            try {
                foreach ($niveles as $nivelData) {
                    $this->procesarNivel($idConvocatoria, $nivelData);
                }

                Log::info('Niveles y grados asociados exitosamente', [
                    'convocatoria_id' => $idConvocatoria,
                    'niveles_count' => count($niveles)
                ]);

                return true;
            } catch (\Exception $e) {
                Log::error('Error al asociar niveles y grados', [
                    'convocatoria_id' => $idConvocatoria,
                    'error' => $e->getMessage()
                ]);
                throw $e;
            }
        });
    }

    /**
     * Obtiene las áreas asociadas a una convocatoria
     */
    public function obtenerAreasPorConvocatoria(int $idConvocatoria): array
    {
        $areas = ConvocatoriaArea::where('id_convocatoria', $idConvocatoria)
            ->with('area')
            ->get()
            ->map(function($convocatoriaArea) {
                return [
                    'id_convocatoria_area' => $convocatoriaArea->id_convocatoria_area,
                    'id_area' => $convocatoriaArea->id_area,
                    'nombre_area' => $convocatoriaArea->area->nombre_area,
                    'costo_inscripcion' => $convocatoriaArea->costo_inscripcion,
                ];
            });

        return $areas->toArray();
    }

    /**
     * Obtiene los niveles asociados a una convocatoria
     */
    public function obtenerNivelesPorConvocatoria(int $idConvocatoria, ?int $idArea = null): array
    {
        // Obtener las áreas de la convocatoria
        $query = ConvocatoriaArea::where('id_convocatoria', $idConvocatoria);
        
        if ($idArea) {
            $query->where('id_area', $idArea);
        }
        
        $areasConvocatoria = $query->get();
        $idAreasConvocatoria = $areasConvocatoria->pluck('id_convocatoria_area')->toArray();

        // Obtener los niveles asignados a esas áreas
        $nivelesAsignados = ConvocatoriaNivel::whereIn('id_convocatoria_area', $idAreasConvocatoria)
            ->with(['nivel', 'convocatoriaArea.area', 'gradoMinimo', 'gradoMaximo'])
            ->get()
            ->map(function($convocatoriaNivel) {
                return [
                    'id_convocatoria_nivel' => $convocatoriaNivel->id_convocatoria_nivel,
                    'id_convocatoria_area' => $convocatoriaNivel->id_convocatoria_area,
                    'id_area' => $convocatoriaNivel->convocatoriaArea->id_area,
                    'nombre_area' => $convocatoriaNivel->convocatoriaArea->area->nombre_area,
                    'id_nivel' => $convocatoriaNivel->id_nivel,
                    'nombre_nivel' => $convocatoriaNivel->nivel->nombre_nivel,
                    'id_grado_min' => $convocatoriaNivel->id_grado_min,
                    'nombre_grado_min' => $convocatoriaNivel->gradoMinimo->nombre_grado,
                    'id_grado_max' => $convocatoriaNivel->id_grado_max,
                    'nombre_grado_max' => $convocatoriaNivel->gradoMaximo->nombre_grado,
                ];
            });

        return $nivelesAsignados->toArray();
    }

    /**
     * Procesa un área individual
     */
    private function procesarArea(int $idConvocatoria, array $areaData): void
    {
        $idArea = $areaData['id_area'];
        
        // Verificar si ya existe esta área para esta convocatoria
        $existingArea = ConvocatoriaArea::where('id_convocatoria', $idConvocatoria)
            ->where('id_area', $idArea)
            ->first();
            
        if ($existingArea) {
            // Actualizar el costo si ya existe
            $existingArea->update([
                'costo_inscripcion' => $areaData['costo_inscripcion']
            ]);
        } else {
            // Crear nueva área
            ConvocatoriaArea::create([
                'id_convocatoria' => $idConvocatoria,
                'id_area' => $idArea,
                'costo_inscripcion' => $areaData['costo_inscripcion'],
            ]);
        }
    }

    /**
     * Procesa un nivel individual
     */
    private function procesarNivel(int $idConvocatoria, array $nivelData): void
    {
        // Obtenemos el área de convocatoria asociada
        $convocatoriaArea = ConvocatoriaArea::where('id_convocatoria', $idConvocatoria)
            ->where('id_area', $nivelData['id_area'])
            ->first();
        
        if (!$convocatoriaArea) {
            throw new \Exception("El área con ID {$nivelData['id_area']} no está asociada a esta convocatoria");
        }
        
        // Validar que el grado mínimo no sea mayor que el máximo
        if ($nivelData['id_grado_min'] > $nivelData['id_grado_max']) {
            throw new \Exception('El grado mínimo no puede ser mayor que el grado máximo');
        }
        
        $idConvocatoriaArea = $convocatoriaArea->id_convocatoria_area;
        $idNivel = $nivelData['id_nivel'];
        
        // Verificar si ya existe este nivel para esta área
        $existingNivel = ConvocatoriaNivel::where('id_convocatoria_area', $idConvocatoriaArea)
            ->where('id_nivel', $idNivel)
            ->first();
            
        if ($existingNivel) {
            // Actualizar si ya existe
            $existingNivel->update([
                'id_grado_min' => $nivelData['id_grado_min'],
                'id_grado_max' => $nivelData['id_grado_max'],
            ]);
        } else {
            // Crear nuevo nivel
            ConvocatoriaNivel::create([
                'id_convocatoria_area' => $idConvocatoriaArea,
                'id_nivel' => $idNivel,
                'id_grado_min' => $nivelData['id_grado_min'],
                'id_grado_max' => $nivelData['id_grado_max'],
            ]);
        }
    }
}
