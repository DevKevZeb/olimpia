<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\ApiController;
use App\Models\AreaCompetencia;
use App\Models\NivelCategoria;
use App\Models\Grado;
use App\Models\Convocatoria;
use App\Models\ConvocatoriaArea;
use App\Models\ConvocatoriaNivel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class BuscarConvocatoriaNivelController extends ApiController
{
    /**
     * Busca el id_convocatoria_nivel basado en id_convocatoria, nombre_area, nombre_nivel y nombre_grado.
     */
    public function buscarIdConvocatoriaNivel(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id_convocatoria' => 'required|exists:convocatorias,id_convocatoria',
            'nombre_area' => 'required|string|max:100|exists:areas_competencia,nombre_area',
            'nombre_nivel' => 'required|string|max:100|exists:niveles_categoria,nombre_nivel',
            'nombre_grado' => 'required|string|max:100|exists:grados,nombre_grado',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        $idConvocatoria = $request->id_convocatoria;
        $nombreArea = $request->nombre_area;
        $nombreNivel = $request->nombre_nivel;
        $nombreGrado = $request->nombre_grado;

        // 1. Obtener IDs correspondientes
        $area = AreaCompetencia::where('nombre_area', $nombreArea)->first();
        $nivel = NivelCategoria::where('nombre_nivel', $nombreNivel)->first();
        $grado = Grado::where('nombre_grado', $nombreGrado)->first();

        if (!$area || !$nivel || !$grado) {
            return $this->errorResponse('No se encontraron los datos proporcionados (área, nivel o grado).', 404);
        }

        $idArea = $area->id_area;
        $idNivel = $nivel->id_nivel;
        $idGrado = $grado->id_grado;

        // 2. Verificar asociación Convocatoria-Área y obtener id_convocatoria_area
        $convocatoriaArea = ConvocatoriaArea::where('id_convocatoria', $idConvocatoria)
            ->where('id_area', $idArea)
            ->first();

        if (!$convocatoriaArea) {
            return $this->errorResponse('El área no está asociada a la convocatoria.', 404);
        }

        $idConvocatoriaArea = $convocatoriaArea->id_convocatoria_area;

        // 3. Verificar asociación ConvocatoriaÁrea-Nivel y Rango de Grados
        $convocatoriaNivel = ConvocatoriaNivel::where('id_convocatoria_area', $idConvocatoriaArea)
            ->where('id_nivel', $idNivel)
            ->where('id_grado_min', '<=', $idGrado)
            ->where('id_grado_max', '>=', $idGrado)
            ->first();

        if (!$convocatoriaNivel) {
            return $this->errorResponse('No se encontró una configuración de nivel y grado válida para esta área en la convocatoria.', 404);
        }

        return $this->successResponse(['id_convocatoria_nivel' => $convocatoriaNivel->id_convocatoria_nivel], 'ID de Convocatoria Nivel encontrado correctamente');
    }
}