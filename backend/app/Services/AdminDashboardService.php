<?php

namespace App\Services;

use App\Models\AreaCompetencia;
use App\Models\Convocatoria;
use App\Models\DetalleListaInscripcion;
use App\Models\Estudiante;
use App\Models\NivelCategoria;
use App\Models\OrdenPago;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AdminDashboardService
{
    public function getDashboardData(): array
    {
        return [
            'estadisticas' => [
                'total_convocatorias' => Convocatoria::count(),
                'total_areas' => AreaCompetencia::count(),
                'total_niveles' => NivelCategoria::count(),
                'total_estudiantes' => Estudiante::count(),
                'total_inscripciones' => DetalleListaInscripcion::count(),
                'ingresos_pendientes' => OrdenPago::where('estado', 'pendiente')->sum('monto_total'),
                'ingresos_pagados' => OrdenPago::where('estado', 'pagada')->sum('monto_total'),
            ],
            'convocatorias_activas' => Convocatoria::whereIn('estado', ['abierta', 'planificada'])
                ->with(['areas.area'])
                ->get(),
            'inscripciones_por_area' => $this->inscripcionesPorArea(),
            'inscripciones_por_mes' => $this->inscripcionesPorMes(),
        ];
    }

    private function inscripcionesPorArea()
    {
        return DB::table('detalles_lista_inscripcion')
            ->join('convocatoria_niveles', 'detalles_lista_inscripcion.id_convocatoria_nivel', '=', 'convocatoria_niveles.id_convocatoria_nivel')
            ->join('convocatoria_areas', 'convocatoria_niveles.id_convocatoria_area', '=', 'convocatoria_areas.id_convocatoria_area')
            ->join('areas_competencia', 'convocatoria_areas.id_area', '=', 'areas_competencia.id_area')
            ->select('areas_competencia.nombre_area', DB::raw('count(*) as total'))
            ->groupBy('areas_competencia.nombre_area')
            ->get();
    }

    /**
     * Inscripciones de los últimos 6 meses, agrupadas en PHP para no depender
     * de funciones de fecha específicas del motor de base de datos.
     */
    private function inscripcionesPorMes()
    {
        return DetalleListaInscripcion::where('fecha_registro', '>=', now()->subMonths(6))
            ->orderBy('fecha_registro')
            ->pluck('fecha_registro')
            ->groupBy(function ($fecha) {
                return Carbon::parse($fecha)->format('Y-m');
            })
            ->map(function ($fechas, $mes) {
                return [
                    'mes' => Carbon::createFromFormat('Y-m', $mes)->format('M Y'),
                    'total' => $fechas->count(),
                ];
            })
            ->values();
    }
}
