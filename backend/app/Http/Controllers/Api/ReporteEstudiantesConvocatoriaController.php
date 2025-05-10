<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Convocatoria;
use App\Models\Inscripcion;
use Illuminate\Support\Facades\DB;

class ReporteEstudiantesConvocatoriaController extends Controller
{
    /**
     * Devuelve un listado de estudiantes inscritos por convocatoria
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $convocatoriaId = $request->query('convocatoria_id');
        if (!$convocatoriaId) {
            return response()->json(['error' => 'convocatoria_id es requerido'], 422);
        }

        $convocatoria = Convocatoria::find($convocatoriaId);
        if (!$convocatoria) {
            return response()->json(['error' => 'Convocatoria no encontrada'], 404);
        }

        // Consulta: estudiantes inscritos en la convocatoria
        $estudiantes = DB::table('inscripciones')
            ->join('estudiantes', 'inscripciones.id_estudiante', '=', 'estudiantes.id_estudiante')
            ->join('convocatoria_niveles', 'inscripciones.id_convocatoria_nivel', '=', 'convocatoria_niveles.id_convocatoria_nivel')
            ->join('convocatoria_areas', 'convocatoria_niveles.id_convocatoria_area', '=', 'convocatoria_areas.id_convocatoria_area')
            ->join('areas_competencia', 'convocatoria_areas.id_area', '=', 'areas_competencia.id_area')
            ->join('niveles_categoria', 'convocatoria_niveles.id_nivel', '=', 'niveles_categoria.id_nivel')
            ->join('grados', 'estudiantes.id_grado', '=', 'grados.id_grado')
            ->leftJoin('unidades_educativas', 'estudiantes.id_unidad_educativa', '=', 'unidades_educativas.id_unidad_educativa')
            ->select(
                'estudiantes.nombres',
                'estudiantes.apellidos',
                'estudiantes.ci',
                'estudiantes.email',
                'estudiantes.fecha_nacimiento',
                'grados.nombre_grado',
                'unidades_educativas.nombre as unidad_educativa',
                'unidades_educativas.departamento',
                'unidades_educativas.provincia',
                'areas_competencia.nombre_area',
                'niveles_categoria.nombre_nivel',
                'inscripciones.fecha_inscripcion',
                'inscripciones.estado'
            )
            ->where('convocatoria_areas.id_convocatoria', $convocatoriaId)
            ->orderBy('estudiantes.apellidos')
            ->orderBy('estudiantes.nombres')
            ->get();

        return response()->json([
            'convocatoria' => [
                'id' => $convocatoria->id_convocatoria,
                'nombre' => $convocatoria->nombre,
            ],
            'estudiantes' => $estudiantes
        ]);
    }
}
