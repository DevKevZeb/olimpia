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

        // Buscar detalle de inscripción relacionado con la convocatoria
        $detalle = DB::table('detalles_lista_inscripcion as dli')
            ->join('convocatoria_niveles as cn', 'dli.id_convocatoria_nivel', '=', 'cn.id_convocatoria_nivel')
            ->join('convocatoria_areas as ca', 'cn.id_convocatoria_area', '=', 'ca.id_convocatoria_area')
            ->where('dli.id_estudiante', $estudiante->id_estudiante)
            ->where('ca.id_convocatoria', $convocatoria->id_convocatoria)
            ->select('dli.id_lista', 'dli.fecha_registro')
            ->first();

        if (!$detalle) {
            return response()->json([
                'estado' => 'No inscrito'
            ]);
        }

        // Buscar estado de inscripción en órdenes de pago
        $orden = DB::table('ordenes_pago')
            ->where('id_lista', $detalle->id_lista)
            ->select('estado')
            ->orderByDesc('id_orden')
            ->first();

        if (!$orden) {
            return response()->json([
                'estado' => 'Inscripción pendiente',
                'fecha_inscripcion' => Carbon::parse($detalle->fecha_registro)->toDateString(),
            ]);
        }

        // Determinar estado legible
        $estado = strtolower($orden->estado);
        if ($estado === 'pagada') {
            $estadoLegible = 'Inscripción finalizada';
        } elseif ($estado === 'pendiente') {
            $estadoLegible = 'Inscripción pendiente';
        } else {
            $estadoLegible = 'No inscrito';
        }

        return response()->json([
            'estado' => $estadoLegible,
            'fecha_inscripcion' => Carbon::parse($detalle->fecha_registro)->toDateString(),
        ]);
    }
}
