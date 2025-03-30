<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Area;
use App\Models\Costo;
use App\Models\Inscripcion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class AreaController extends Controller
{
    public function index()
    {
        $areas = Area::all();
        return response()->json([
            'status' => 'success',
            'data' => $areas
        ]);
    }
    
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|unique:Area,nombre|max:100',
            'descripcion' => 'nullable'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()
            ], 400);
        }
        
        $area = Area::create($request->all());
        
        return response()->json([
            'status' => 'success',
            'message' => 'Área creada exitosamente',
            'data' => $area
        ], 201);
    }
    
    public function show($id)
    {
        $area = Area::find($id);
        
        if (!$area) {
            return response()->json([
                'status' => 'error',
                'message' => 'Área no encontrada'
            ], 404);
        }
        
        return response()->json([
            'status' => 'success',
            'data' => $area
        ]);
    }
    
    public function update(Request $request, $id)
    {
        $area = Area::find($id);
        
        if (!$area) {
            return response()->json([
                'status' => 'error',
                'message' => 'Área no encontrada'
            ], 404);
        }
        
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|max:100|unique:Area,nombre,' . $id . ',Id_area',
            'descripcion' => 'nullable'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()
            ], 400);
        }
        
        $area->update($request->all());
        
        return response()->json([
            'status' => 'success',
            'message' => 'Área actualizada exitosamente',
            'data' => $area
        ]);
    }
    
    public function destroy($id)
    {
        $area = Area::find($id);
        
        if (!$area) {
            return response()->json([
                'status' => 'error',
                'message' => 'Área no encontrada'
            ], 404);
        }
        
        // Verificar si hay inscripciones que utilizan esta área
        $inscripcionesCount = Inscripcion::where('Id_area', $id)->count();
        if ($inscripcionesCount > 0) {
            return response()->json([
                'status' => 'error',
                'message' => 'No se puede eliminar esta área porque hay '.$inscripcionesCount.' inscripción(es) que la utilizan'
            ], 400);
        }
        
        try {
            // Iniciar una transacción
            DB::beginTransaction();
            
            // Eliminar primero los costos asociados a esta área
            Costo::where('Id_area', $id)->delete();
            
            // Ahora eliminar el área
            $area->delete();
            
            // Confirmar transacción
            DB::commit();
            
            return response()->json([
                'status' => 'success',
                'message' => 'Área y sus costos asociados eliminados exitosamente'
            ]);
        } catch (\Exception $e) {
            // Revertir la transacción en caso de error
            DB::rollBack();
            
            return response()->json([
                'status' => 'error',
                'message' => 'Ocurrió un error al eliminar el área: ' . $e->getMessage()
            ], 500);
        }
    }
}
