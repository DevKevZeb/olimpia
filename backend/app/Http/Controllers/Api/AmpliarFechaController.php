<?php

namespace App\Http\Controllers\Api;

use App\Models\Convocatoria;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Requests\UpdateFechaConvocatoriaRequest;

class AmpliarFechaController extends ApiController
{
    /**
     * Actualiza la fecha de fin de inscripción de una convocatoria.
     */
    public function actualizarFecha(UpdateFechaConvocatoriaRequest $request, int $id): JsonResponse
    {
        $convocatoria = Convocatoria::find($id);

        if (!$convocatoria) {
            return $this->errorResponse('Convocatoria no encontrada', 404);
        }

        $convocatoria->fecha_fin_inscripcion = $request->nueva_fecha;
        $convocatoria->save();

        return $this->successResponse(
            $convocatoria, // Puedes devolver el modelo actualizado
            'Fecha de inscripción ampliada correctamente'
        );
    }
    
    /**
     * Lista todas las convocatorias (puede usarse para el slider).
     */
    public function index(): JsonResponse
    {
        $convocatorias = Convocatoria::orderBy('fecha_fin_inscripcion', 'desc')->get([
            'id_convocatoria',
            'nombre',
            'fecha_fin_inscripcion'
        ]);

        return $this->successResponse($convocatorias, 'Lista de convocatorias obtenida correctamente');
    }
}
