<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\NivelCategoria;
use App\Models\Costo;
use App\Models\Inscripcion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class NivelCategoriaController extends Controller
{
    public function index()
    {
        $niveles = NivelCategoria::all();
        return response()->json([
            'status' => 'success',
            'data' => $niveles
        ]);
    }
    
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|unique:NivelCategoria,nombre|max:100'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()
            ], 400);
        }
        
        $nivel = NivelCategoria::create($request->all());
        
        return response()->json([
            'status' => 'success',
            'message' => 'Nivel/Categoría creado exitosamente',
            'data' => $nivel
        ], 201);
    }
    
    public function show($id)
    {
        $nivel = NivelCategoria::find($id);
        
        if (!$nivel) {
            return response()->json([
                'status' => 'error',
                'message' => 'Nivel/Categoría no encontrado'
            ], 404);
        }
        
        return response()->json([
            'status' => 'success',
            'data' => $nivel
        ]);
    }
    
    public function update(Request $request, $id)
    {
        $nivel = NivelCategoria::find($id);
        
        if (!$nivel) {
            return response()->json([
                'status' => 'error',
                'message' => 'Nivel/Categoría no encontrado'
            ], 404);
        }
        
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|max:100|unique:NivelCategoria,nombre,' . $id . ',Id_nivel'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()
            ], 400);
        }
        
        $nivel->update($request->all());
        
        return response()->json([
            'status' => 'success',
            'message' => 'Nivel/Categoría actualizado exitosamente',
            'data' => $nivel
        ]);
    }
    
    public function destroy($id)
    {
        $nivel = NivelCategoria::find($id);
        
        if (!$nivel) {
            return response()->json([
                'status' => 'error',
                'message' => 'Nivel/Categoría no encontrado'
            ], 404);
        }
        
        // Verificar si hay inscripciones que usan este nivel
        $inscripcionesCount = Inscripcion::where('Id_nivel', $id)->count();
        if ($inscripcionesCount > 0) {
            return response()->json([
                'status' => 'error',
                'message' => 'No se puede eliminar este nivel porque hay '.$inscripcionesCount.' inscripción(es) que lo utilizan'
            ], 400);
        }
        
        try {
            // Iniciar una transacción para garantizar que todo se ejecute o nada
            DB::beginTransaction();
            
            // Eliminar primero los costos asociados a este nivel
            Costo::where('Id_nivel', $id)->delete();
            
            // Ahora eliminar el nivel
            $nivel->delete();
            
            // Confirmar transacción
            DB::commit();
            
            return response()->json([
                'status' => 'success',
                'message' => 'Nivel/Categoría y sus costos asociados eliminados exitosamente'
            ]);
        } catch (\Exception $e) {
            // Revertir la transacción en caso de error
            DB::rollBack();
            
            return response()->json([
                'status' => 'error',
                'message' => 'Ocurrió un error al eliminar el nivel: ' . $e->getMessage()
            ], 500);
        }
    }
}
