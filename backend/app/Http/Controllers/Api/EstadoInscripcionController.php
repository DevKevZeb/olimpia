<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use App\Models\Estudiante;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class EstadoInscripcionController extends Controller
{
    public function show($ci): JsonResponse
    {
        // Validar formato de CI
        if (!ctype_digit($ci)) {
            return response()->json([
                'message' => 'El CI debe contener solo números.',
            ], 400);
        }

        // Buscar estudiante por CI
        $estudiante = Estudiante::where('ci', $ci)->first();

        if (!$estudiante) {
            return response()->json([
                'estado' => 'No inscrito'
            ]);
        }
        

        // Buscar convocatoria activa
        $convocatoria = DB::table('convocatorias')
            ->where('estado', 'abierta')
            ->orderByDesc('id_convocatoria')
            ->first();

        if (!$convocatoria) {
            return response()->json([
                'message' => 'No hay convocatorias activas.',
            ], 404);
        }

        // Buscar inscripción del estudiante en convocatoria activa
        $inscripcion = DB::table('inscripciones')
            ->join('convocatoria_niveles', 'inscripciones.id_convocatoria_nivel', '=', 'convocatoria_niveles.id_convocatoria_nivel')
            ->join('convocatoria_areas', 'convocatoria_niveles.id_convocatoria_area', '=', 'convocatoria_areas.id_convocatoria_area')
            ->where('inscripciones.id_estudiante', $estudiante->id_estudiante)
            ->where('convocatoria_areas.id_convocatoria', $convocatoria->id_convocatoria)
            ->select('inscripciones.id_inscripcion', 'inscripciones.fecha_inscripcion', 'inscripciones.estado')
            ->first();

        if (!$inscripcion) {
            return response()->json([
                'estado' => 'No inscrito'
            ]);
        }

        // Traducir estado técnico a estado legible
        $estado = strtolower($inscripcion->estado);
        if (in_array($estado, ['verificada', 'pagada'])) {
            $estadoLegible = 'Inscripción finalizada';
        } elseif ($estado === 'pendiente') {
            $estadoLegible = 'Inscripción pendiente';
        } else {
            $estadoLegible = 'No inscrito';
        }

        return response()->json([
            'estado' => $estadoLegible,
            'fecha_inscripcion' => Carbon::parse($inscripcion->fecha_inscripcion)->toDateString(), // Formato YYYY-MM-DD
        ]);
    }
}
