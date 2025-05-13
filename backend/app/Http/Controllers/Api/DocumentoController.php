<?php

namespace App\Http\Controllers\Api;

use Exception;
use App\Models\Convocatoria;
use Illuminate\Http\Request;
use App\Models\ConvocatoriaArea;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

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
     * Recibirá un documento PDF más adelante.
     */
    public function subirDocumento(Request $request): JsonResponse
    {
        $data = $request->all();

        if(!$data){
            return $this->errorResponse('Convocatoria no encontrada', 404);
        }

        $id_area  = $data['id_area'];
        $id_convocatoria = $data['id_convocatoria']; 
        $file = $data['file']; 

        Log::info("area" . json_decode($id_area));
        Log::info("fiel" . json_decode($file));

        try {
            if ($request->hasFile('file')) {
                $ruta = $request->file('file')->store("public/anexo/$id_convocatoria/$id_area");
                Log::info("archivo guardado en ". $ruta);
                $storage = Storage::url($ruta);
            }
        } catch (\Exception $e) {
            return $this->errorResponse('Error al subir documento: ' . $e->getMessage(), 500);
        }
        

        // Lógica pendiente para subir archivo y registrar datos.
        return $this->successResponse(json_encode($storage), 'Espacio reservado para subir documentos');
    }
}