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
     * 
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
        $estudiantes = DB::table('detalles_lista_inscripcion')
            ->join('estudiantes', 'detalles_lista_inscripcion.id_estudiante', '=', 'estudiantes.id_estudiante')
            ->join('convocatoria_niveles', 'detalles_lista_inscripcion.id_convocatoria_nivel', '=', 'convocatoria_niveles.id_convocatoria_nivel')
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
                'detalles_lista_inscripcion.fecha_inscripcion',
                'detalles_lista_inscripcion.estado'
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

    /**
     * Devuelve el total de estudiantes inscritos por área para una convocatoria
     * @param Request $request
     * @return JsonResponse
     */
    public function inscritosPorDepartamento(Request $request): JsonResponse
    {
        $convocatoriaId = $request->query('convocatoria_id');
        $departamento = $request->query('departamento');
        if (!$convocatoriaId) {
            return response()->json(['error' => 'convocatoria_id es requerido'], 422);
        }
        if (!$departamento) {
            return response()->json(['error' => 'departamento es requerido'], 422);
        }

        $convocatoria = \App\Models\Convocatoria::find($convocatoriaId);
        if (!$convocatoria) {
            return response()->json(['error' => 'Convocatoria no encontrada'], 404);
        }

        // Obtener los datos agrupados por área y los estudiantes de cada área
        $areas = \DB::table('detalles_lista_inscripcion')
            ->join('estudiantes', 'detalles_lista_inscripcion.id_estudiante', '=', 'estudiantes.id_estudiante')
            ->join('convocatoria_niveles', 'detalles_lista_inscripcion.id_convocatoria_nivel', '=', 'convocatoria_niveles.id_convocatoria_nivel')
            ->join('convocatoria_areas', 'convocatoria_niveles.id_convocatoria_area', '=', 'convocatoria_areas.id_convocatoria_area')
            ->join('areas_competencia', 'convocatoria_areas.id_area', '=', 'areas_competencia.id_area')
            ->where('convocatoria_areas.id_convocatoria', $convocatoriaId)
            // ->where('convocatoria_areas.', $departamento)
            ->select(
                'areas_competencia.nombre_area',
                'estudiantes.nombres',
                'estudiantes.apellidos',
                'estudiantes.ci',
                'estudiantes.email',
                'estudiantes.fecha_nacimiento'
            )
            ->orderBy('areas_competencia.nombre_area')
            ->orderBy('estudiantes.apellidos')
            ->orderBy('estudiantes.nombres')
            ->get();

        // Agrupar estudiantes por área
        $reporte = [];
        foreach ($areas as $row) {
            $area = $row->nombre_area;
            if (!isset($reporte[$area])) {
                $reporte[$area] = [
                    'nombre_area' => $area,
                    'total_inscritos' => 0,
                    'estudiantes' => []
                ];
            }
            $reporte[$area]['total_inscritos']++;
            $reporte[$area]['estudiantes'][] = [
                'nombres' => $row->nombres,
                'apellidos' => $row->apellidos,
                'ci' => $row->ci,
                'email' => $row->email,
                'fecha_nacimiento' => $row->fecha_nacimiento
            ];
        }
        $reporte = array_values($reporte);

        return response()->json([
            'convocatoria' => [
                'id' => $convocatoria->id_convocatoria,
                'nombre' => $convocatoria->nombre,
            ],
            'reporte' => $reporte
        ]);
    }


    /**
     * Devuelve el total de estudiantes inscritos por área para una convocatoria
     * @param Request $request
     * @return JsonResponse
     */
    public function inscritosPorArea(Request $request): JsonResponse
    {
        $convocatoriaId = $request->query('convocatoria_id');
        if (!$convocatoriaId) {
            return response()->json(['error' => 'convocatoria_id es requerido'], 422);
        }

        $convocatoria = \App\Models\Convocatoria::find($convocatoriaId);
        if (!$convocatoria) {
            return response()->json(['error' => 'Convocatoria no encontrada'], 404);
        }

        // Obtener los datos agrupados por área y los estudiantes de cada área
        $areas = \DB::table('detalles_lista_inscripcion')
            ->join('estudiantes', 'detalles_lista_inscripcion.id_estudiante', '=', 'estudiantes.id_estudiante')
            ->join('convocatoria_niveles', 'detalles_lista_inscripcion.id_convocatoria_nivel', '=', 'convocatoria_niveles.id_convocatoria_nivel')
            ->join('convocatoria_areas', 'convocatoria_niveles.id_convocatoria_area', '=', 'convocatoria_areas.id_convocatoria_area')
            ->join('areas_competencia', 'convocatoria_areas.id_area', '=', 'areas_competencia.id_area')
            ->where('convocatoria_areas.id_convocatoria', $convocatoriaId)
            ->select(
                'areas_competencia.nombre_area',
                'estudiantes.nombres',
                'estudiantes.apellidos',
                'estudiantes.ci',
                'estudiantes.email',
                'estudiantes.fecha_nacimiento'
            )
            ->orderBy('areas_competencia.nombre_area')
            ->orderBy('estudiantes.apellidos')
            ->orderBy('estudiantes.nombres')
            ->get();

        // Agrupar estudiantes por área
        $reporte = [];
        foreach ($areas as $row) {
            $area = $row->nombre_area;
            if (!isset($reporte[$area])) {
                $reporte[$area] = [
                    'nombre_area' => $area,
                    'total_inscritos' => 0,
                    'estudiantes' => []
                ];
            }
            $reporte[$area]['total_inscritos']++;
            $reporte[$area]['estudiantes'][] = [
                'nombres' => $row->nombres,
                'apellidos' => $row->apellidos,
                'ci' => $row->ci,
                'email' => $row->email,
                'fecha_nacimiento' => $row->fecha_nacimiento
            ];
        }
        $reporte = array_values($reporte);

        return response()->json([
            'convocatoria' => [
                'id' => $convocatoria->id_convocatoria,
                'nombre' => $convocatoria->nombre,
            ],
            'reporte' => $reporte
        ]);
    }
}
