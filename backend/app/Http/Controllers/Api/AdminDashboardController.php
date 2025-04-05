<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AreaCompetencia;
use App\Models\Convocatoria;
use App\Models\Estudiante;
use App\Models\Grado;
use App\Models\Inscripcion;
use App\Models\NivelCategoria;
use App\Models\OrdenPago;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends ApiController
{
    /**
     * Obtiene estadísticas y datos para el dashboard administrativo
     * 
     * @return JsonResponse
     */
    public function getDashboardData(): JsonResponse
    {
        // Estadísticas generales
        $totalEstudiantes = Estudiante::count();
        $totalInscripciones = Inscripcion::count();
        $totalIngresosPendientes = OrdenPago::where('estado', 'pendiente')->sum('monto_total');
        $totalIngresosPagados = OrdenPago::where('estado', 'pagada')->sum('monto_total');
        
        // Convocatorias activas
        $convocatoriasActivas = Convocatoria::whereIn('estado', ['abierta', 'planificada'])
            ->with(['areas.area'])
            ->get();
            
        // Inscripciones por área
        $inscripcionesPorArea = DB::table('inscripciones')
            ->join('convocatoria_areas', 'inscripciones.id_convocatoria_area', '=', 'convocatoria_areas.id_convocatoria_area')
            ->join('areas_competencia', 'convocatoria_areas.id_area', '=', 'areas_competencia.id_area')
            ->select('areas_competencia.nombre_area', DB::raw('count(*) as total'))
            ->groupBy('areas_competencia.nombre_area')
            ->get();
            
        // Inscripciones por mes (últimos 6 meses)
        $inscripcionesPorMes = DB::table('inscripciones')
            ->select(DB::raw('YEAR(fecha_inscripcion) as anio'), DB::raw('MONTH(fecha_inscripcion) as mes'), DB::raw('count(*) as total'))
            ->where('fecha_inscripcion', '>=', now()->subMonths(6))
            ->groupBy('anio', 'mes')
            ->orderBy('anio')
            ->orderBy('mes')
            ->get()
            ->map(function($item) {
                $fechaMes = \Carbon\Carbon::createFromDate($item->anio, $item->mes, 1);
                return [
                    'mes' => $fechaMes->format('M Y'),
                    'total' => $item->total
                ];
            });
            
        // Catálogos para formularios
        $areas = AreaCompetencia::all();
        $grados = Grado::orderBy('orden')->get();
        $niveles = NivelCategoria::with(['area', 'gradoMin', 'gradoMax'])->get();
            
        return $this->successResponse([
            'estadisticas' => [
                'total_estudiantes' => $totalEstudiantes,
                'total_inscripciones' => $totalInscripciones,
                'ingresos_pendientes' => $totalIngresosPendientes,
                'ingresos_pagados' => $totalIngresosPagados,
            ],
            'convocatorias_activas' => $convocatoriasActivas,
            'inscripciones_por_area' => $inscripcionesPorArea,
            'inscripciones_por_mes' => $inscripcionesPorMes,
            'catalogos' => [
                'areas' => $areas,
                'grados' => $grados,
                'niveles' => $niveles,
            ]
        ], 'Datos del dashboard obtenidos correctamente');
    }
}
