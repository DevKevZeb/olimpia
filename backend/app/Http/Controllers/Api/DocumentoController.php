<?php

namespace App\Http\Controllers\Api;

use Exception;
use App\Models\Convocatoria;
use Illuminate\Http\Request;
use App\Models\AreaCompetencia;
use App\Models\ConvocatoriaArea;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class DocumentoController extends ApiController
{
    /**
     * Devuelve las áreas asociadas a una convocatoria.
     */
    public function obtenerAreasPorConvocatoria(int $id): JsonResponse
    {
        $convocatoria = Convocatoria::find($id);

        if (!$convocatoria) {
            return $this->errorResponse('Convocatoria no encontrada', 404);
        }

        $areas = ConvocatoriaArea::where('id_convocatoria', $id)
            ->with('area') // Asegúrate de que la relación area() exista en el modelo
            ->get();

        return $this->successResponse($areas, 'Áreas obtenidas correctamente');
    }

    /**
     * Sube el anexo (PDF) de un área de competencia.
     */
    public function subirDocumento(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id_convocatoria' => 'required|integer|exists:convocatorias,id_convocatoria',
            'id_area' => 'required|integer|exists:areas_competencia,id_area',
            'file' => 'required|file|mimes:pdf|max:10240',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422, $validator->errors());
        }

        $area = AreaCompetencia::find($request->id_area);
        $anexoAnterior = $area->anexo;
        $ruta = $request->file('file')->store("public/anexo/{$request->id_convocatoria}/{$area->id_area}");

        try {
            $area->update(['anexo' => $ruta]);
        } catch (Exception $e) {
            Storage::delete($ruta);
            Log::error('Error al registrar el anexo del área', ['id_area' => $area->id_area, 'error' => $e->getMessage()]);
            return $this->errorResponse('No se pudo registrar el documento', 500);
        }

        if ($anexoAnterior && $anexoAnterior !== $ruta) {
            Storage::delete($anexoAnterior);
        }

        return $this->successResponse(['anexo' => $ruta], 'Documento subido correctamente');
    }

    /**
     * Descarga el anexo de un área de competencia.
     */
    public function descargarDocumento(int $id_area)
    {
        $area = AreaCompetencia::find($id_area);

        if (!$area || !$area->anexo || !Storage::exists($area->anexo)) {
            return $this->errorResponse('Documento no encontrado', 404);
        }

        return Storage::download($area->anexo);
    }
}