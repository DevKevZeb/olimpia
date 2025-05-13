<?php

namespace App\Http\Controllers\Api;

use Exception;
use App\Models\Convocatoria;
use Illuminate\Http\Request;
use App\Models\AreaCompetencia;
use App\Models\ConvocatoriaArea;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
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
    public function subirDocumento(Request $request)
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

        DB::beginTransaction();
        try {
            if ($request->hasFile('file')) {
                $ruta = $request->file('file')->store("public/anexo/$id_convocatoria/$id_area");
                Log::info("archivo guardado en ". $ruta);
                $fileurl = Storage::put("public/anexo/$id_convocatoria/$id_area", $file);
               $url = $fileurl;
            }

            Log::info('find ' . json_encode($id_area));
            $area = AreaCompetencia::find($id_area);

            Log::info('area' . json_encode($area));
            $area->update([
                'anexo' => $url
            ]);
            Log::info('area despues' . json_encode($area));
            Log::info(json_encode($url));
            
            
            // Log::info(json_encode(
            //  "despues" .     
            //     json_encode(file_get_contents($url))
            // ));


            
            DB::commit();
        } catch (\Exception $e) {
            return $this->errorResponse('Error al subir documento: ' . $e->getMessage(), 500);
        }
        
        // Lógica pendiente para subir archivo y registrar datos.
        return $this->successResponse(json_encode($url), 'Espacio reservado para subir documentos');
    
    }


    public function descargarDocumento(Request $request , $id_area)
    {
        
        try {
            
            
            $area = AreaCompetencia::find($id_area);
            Log::alert("???" . $area);
            $fileurl = $area->anexo;
            Log::alert("dasdas".$fileurl);
            if (!Storage::exists($fileurl)) {
                abort(404, 'File not found.');
            }
    
            
        } catch (\Exception $e) {
            return $this->errorResponse('Error al subir documento: ' . $e->getMessage(), 500);
        }
        
        return Storage::download($fileurl);
    }
}