<?php

namespace App\Http\Controllers\Api;
 
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class HomeController extends Controller
{
    /**
     * Retorna las áreas de la convocatoria activa junto a sus descripciones.
     */
    public function areasDeConvocatoriaActiva(): JsonResponse
    {
        // Obtener convocatoria activa más reciente
        $convocatoria = DB::table('convocatorias')
            ->where('estado', 'abierta')
            ->orderByDesc('id_convocatoria')
            ->first();

        if (!$convocatoria) {
            return response()->json([
                'status' => 'Error',
                'message' => 'No hay convocatoria activa.',
                'data' => null
            ], 404);
        }

        // Obtener las áreas asociadas a la convocatoria
        $areas = DB::table('convocatoria_areas')
            ->join('areas_competencia', 'convocatoria_areas.id_area', '=', 'areas_competencia.id_area')
            ->where('convocatoria_areas.id_convocatoria', $convocatoria->id_convocatoria)
            ->select(
                'areas_competencia.id_area',
                'areas_competencia.nombre_area',
                'areas_competencia.descripcion'
            )
            ->get();

        return response()->json([
            'status' => 'OK',
            'message' => 'Áreas obtenidas correctamente',
            'data' => [
                'convocatoria' => [
                    'id_convocatoria' => $convocatoria->id_convocatoria,
                    'titulo' => $convocatoria->nombre ?? null
                ],
                'areas' => $areas,
            ]
        ]);
    }

    /**
     * Placeholder: Retorna el documento asociado a una área específica.
     * (Por ahora solo una respuesta de que no está disponible)
     */
    public function documentoDeArea($idArea): JsonResponse
    {
        return response()->json([
            'message' => 'Esta función estará disponible próximamente.',
        ], 501); // 501 Not Implemented
    }
}