<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Grado;
use App\Models\Competidor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class GradoController extends Controller
{
    public function index()
    {
        $grados = Grado::all();
        return response()->json([
            'status' => 'success',
            'data' => $grados
        ]);
    }
    
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|unique:Grado,nombre|max:50'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()
            ], 400);
        }
        
        $grado = Grado::create($request->all());
        
        return response()->json([
            'status' => 'success',
            'message' => 'Grado creado exitosamente',
            'data' => $grado
        ], 201);
    }
    
    public function show($id)
    {
        $grado = Grado::find($id);
        
        if (!$grado) {
            return response()->json([
                'status' => 'error',
                'message' => 'Grado no encontrado'
            ], 404);
        }
        
        return response()->json([
            'status' => 'success',
            'data' => $grado
        ]);
    }
    
    public function update(Request $request, $id)
    {
        $grado = Grado::find($id);
        
        if (!$grado) {
            return response()->json([
                'status' => 'error',
                'message' => 'Grado no encontrado'
            ], 404);
        }
        
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|max:50|unique:Grado,nombre,' . $id . ',Id_grado'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()
            ], 400);
        }
        
        $grado->update($request->all());
        
        return response()->json([
            'status' => 'success',
            'message' => 'Grado actualizado exitosamente',
            'data' => $grado
        ]);
    }
    
    public function destroy($id)
    {
        $grado = Grado::find($id);
        
        if (!$grado) {
            return response()->json([
                'status' => 'error',
                'message' => 'Grado no encontrado'
            ], 404);
        }
        
        // Verificar si hay competidores que utilizan este grado
        $competidoresCount = Competidor::where('Id_grado', $id)->count();
        if ($competidoresCount > 0) {
            return response()->json([
                'status' => 'error',
                'message' => 'No se puede eliminar este grado porque hay '.$competidoresCount.' competidor(es) que lo utilizan'
            ], 400);
        }
        
        try {
            $grado->delete();
            
            return response()->json([
                'status' => 'success',
                'message' => 'Grado eliminado exitosamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Ocurrió un error al eliminar el grado: ' . $e->getMessage()
            ], 500);
        }
    }
}
