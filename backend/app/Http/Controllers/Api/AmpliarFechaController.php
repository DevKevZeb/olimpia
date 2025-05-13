<?php

namespace App\Http\Controllers\Api;

use App\Models\Convocatoria;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class AmpliarFechaController extends ApiController
{
    /**
     * Actualiza la fecha de fin de inscripción de una convocatoria.
     */
    public function actualizarFecha(Request $request, int $id): JsonResponse
    {
        $convocatoria = Convocatoria::find($id);

        if (!$convocatoria) {
            return $this->errorResponse('Convocatoria no encontrada', 404);
        }

        $validator = Validator::make($request->all(), [
            'nueva_fecha' => 'required|date|after:' . $convocatoria->fecha_fin_inscripcion,
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        $convocatoria->fecha_fin_inscripcion = $request->nueva_fecha;
        $convocatoria->save();

        return $this->successResponse(
            $convocatoria,
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
