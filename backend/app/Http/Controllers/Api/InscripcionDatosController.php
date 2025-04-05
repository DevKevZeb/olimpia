<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Convocatoria;
use App\Models\Grado;
use App\Models\UnidadEducativa;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InscripcionDatosController extends ApiController
{
    /**
     * Obtiene todos los datos necesarios para el formulario de inscripción
     * 
     * @return JsonResponse
     */
    public function getDatosInscripcion(): JsonResponse
    {
        // Obtener la convocatoria actual (abierta)
        $convocatoria = Convocatoria::where('estado', 'abierta')
            ->with([
                'areas.area', // Obtener áreas con sus detalles
                'niveles.nivel.gradoMin', // Niveles con sus grados mínimos
                'niveles.nivel.gradoMax', // Niveles con sus grados máximos
                'areas.area.nivelesCategoria', // Niveles asociados a cada área
            ])
            ->latest()
            ->first();

        if (!$convocatoria) {
            return $this->errorResponse('No hay convocatorias abiertas actualmente', 404);
        }

        // Obtener todos los grados ordenados
        $grados = Grado::orderBy('orden', 'asc')->get();

        // Obtener unidades educativas (limitadas para no sobrecargar)
        $unidadesEducativas = UnidadEducativa::take(100)->get();

        // Preparar el mapa de niveles por área
        $nivelesPorArea = [];
        foreach ($convocatoria->areas as $convocatoriaArea) {
            $area = $convocatoriaArea->area;
            $nivelesArea = [];
            
            foreach ($convocatoria->niveles as $convocatoriaNivel) {
                $nivel = $convocatoriaNivel->nivel;
                if ($nivel->id_area == $area->id_area) {
                    $nivelesArea[] = [
                        'id' => $nivel->id_nivel,
                        'nombre' => $nivel->nombre_nivel,
                        'grado_min' => $nivel->id_grado_min,
                        'grado_max' => $nivel->id_grado_max,
                    ];
                }
            }
            
            $nivelesPorArea[$area->id_area] = $nivelesArea;
        }

        return $this->successResponse([
            'convocatoria' => [
                'id' => $convocatoria->id_convocatoria,
                'nombre' => $convocatoria->nombre,
                'fecha_inicio' => $convocatoria->fecha_inicio_inscripcion,
                'fecha_fin' => $convocatoria->fecha_fin_inscripcion,
                'max_areas' => $convocatoria->max_areas_por_estudiante,
                'estado' => $convocatoria->estado,
            ],
            'areas' => $convocatoria->areas->map(function($convocatoriaArea) {
                return [
                    'id' => $convocatoriaArea->id_convocatoria_area,
                    'id_area' => $convocatoriaArea->id_area,
                    'nombre' => $convocatoriaArea->area->nombre_area,
                    'costo' => $convocatoriaArea->costo_inscripcion,
                ];
            }),
            'niveles_por_area' => $nivelesPorArea,
            'grados' => $grados,
            'unidades_educativas' => $unidadesEducativas->take(20), // Limitamos para no cargar demasiado
        ], 'Datos para inscripción obtenidos correctamente');
    }

    /**
     * Busca unidades educativas por nombre (para autocompletado)
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function buscarUnidadesEducativas(Request $request): JsonResponse
    {
        $query = $request->query('q');
        
        if (!$query || strlen($query) < 3) {
            return $this->errorResponse('La búsqueda debe tener al menos 3 caracteres', 422);
        }

        $unidades = UnidadEducativa::where('nombre', 'like', "%{$query}%")
            ->orWhere('departamento', 'like', "%{$query}%")
            ->take(10)
            ->get();

        return $this->successResponse($unidades, 'Unidades educativas encontradas');
    }
}
