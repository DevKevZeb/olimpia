<?php

namespace App\Http\Controllers\Api;
 
use App\Http\Controllers\Api\ApiController;
use App\Models\ConvocatoriaNivel;
use App\Models\NivelCategoria;
use App\Models\Area;
use App\Models\ConvocatoriaArea;
use App\Models\Grado;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB; // <--- ADD THIS LINE!

class ConvocatoriaConfigController extends ApiController
{
    /**
     * Obtiene todas las configuraciones de niveles para una convocatoria específica.
     *
     * @param int $id_convocatoria
     * @return JsonResponse
     */
    public function getAllConvocatoriaNiveles(int $id_convocatoria): JsonResponse
    {
        // Removed validation for id_convocatoria as per previous discussion, assuming route handles it.
        // If you need the 'exists' validation, you'll need to re-add the validator block
        // and pass $id_convocatoria to it, or use route model binding.

        try {
            $convocatoriaNiveles = DB::table('convocatoria_niveles as cn')
                ->join('convocatoria_areas as ca', 'cn.id_convocatoria_area', '=', 'ca.id_convocatoria_area')
                // IMPORTANT: Replace 'areas_competencia' with the ACTUAL table name for your areas/competencies.
                // You confirmed this was 'areas_competencia' in a previous step, so keeping it here.
                ->join('areas_competencia as a', 'ca.id_area', '=', 'a.id_area')
                ->join('niveles_categoria as nc', 'cn.id_nivel', '=', 'nc.id_nivel')
                ->join('grados as gm', 'cn.id_grado_min', '=', 'gm.id_grado')
                ->join('grados as gx', 'cn.id_grado_max', '=', 'gx.id_grado')
                ->where('ca.id_convocatoria', $id_convocatoria) // Use $id_convocatoria directly from the route
                ->select(
                    'cn.id_convocatoria_nivel',
                    'a.nombre_area',
                    'nc.nombre_nivel',
                    'gm.nombre_grado as nombre_grado_min',
                    'gx.nombre_grado as nombre_grado_max',
                    'ca.id_area',
                    'cn.id_nivel',
                    'cn.id_grado_min',
                    'cn.id_grado_max'
                )
                ->get();

            if ($convocatoriaNiveles->isEmpty()) {
                return $this->errorResponse('No se encontraron configuraciones de nivel para la convocatoria proporcionada.', 404);
            }

            return $this->successResponse($convocatoriaNiveles, 'Configuraciones de convocatoria nivel obtenidas correctamente.');

        } catch (\Exception $e) {
            // It's good that you have this error handling for debugging
            return $this->errorResponse('Error al cargar configuraciones de convocatoria: ' . $e->getMessage(), 500);
        }
    }
}