<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Costo;
use App\Models\Area;
use App\Models\NivelCategoria;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CostoController extends Controller
{
    public function index()
    {
        $costos = Costo::with(['area', 'nivel'])->get();
        return response()->json([
            'status' => 'success',
            'data' => $costos
        ]);
    }
    
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'Id_area' => 'required|exists:Area,Id_area',
            'Id_nivel' => 'required|exists:NivelCategoria,Id_nivel',
            'monto' => 'required|numeric|min:0'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()
            ], 400);
        }
        
        // Verificar si ya existe un costo para esta combinación de área y nivel
        $existingCosto = Costo::where('Id_area', $request->Id_area)
                               ->where('Id_nivel', $request->Id_nivel)
                               ->first();
        
        if ($existingCosto) {
            return response()->json([
                'status' => 'error',
                'message' => 'Ya existe un costo para esta combinación de área y nivel'
            ], 400);
        }
        
        $costo = Costo::create($request->all());
        
        return response()->json([
            'status' => 'success',
            'message' => 'Costo creado exitosamente',
            'data' => $costo
        ], 201);
    }
    
    public function show($id)
    {
        $costo = Costo::with(['area', 'nivel'])->find($id);
        
        if (!$costo) {
            return response()->json([
                'status' => 'error',
                'message' => 'Costo no encontrado'
            ], 404);
        }
        
        return response()->json([
            'status' => 'success',
            'data' => $costo
        ]);
    }
    
    public function update(Request $request, $id)
    {
        $costo = Costo::find($id);
        
        if (!$costo) {
            return response()->json([
                'status' => 'error',
                'message' => 'Costo no encontrado'
            ], 404);
        }
        
        $validator = Validator::make($request->all(), [
            'Id_area' => 'sometimes|required|exists:Area,Id_area',
            'Id_nivel' => 'sometimes|required|exists:NivelCategoria,Id_nivel',
            'monto' => 'sometimes|required|numeric|min:0'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()
            ], 400);
        }
        
        // Verificar si ya existe otro costo para esta combinación de área y nivel
        if ($request->has('Id_area') || $request->has('Id_nivel')) {
            $area_id = $request->input('Id_area', $costo->Id_area);
            $nivel_id = $request->input('Id_nivel', $costo->Id_nivel);
            
            $existingCosto = Costo::where('Id_area', $area_id)
                                   ->where('Id_nivel', $nivel_id)
                                   ->where('Id_costo', '!=', $id)
                                   ->first();
            
            if ($existingCosto) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Ya existe un costo para esta combinación de área y nivel'
                ], 400);
            }
        }
        
        $costo->update($request->all());
        
        return response()->json([
            'status' => 'success',
            'message' => 'Costo actualizado exitosamente',
            'data' => $costo
        ]);
    }
    
    public function destroy($id)
    {
        $costo = Costo::find($id);
        
        if (!$costo) {
            return response()->json([
                'status' => 'error',
                'message' => 'Costo no encontrado'
            ], 404);
        }
        
        $costo->delete();
        
        return response()->json([
            'status' => 'success',
            'message' => 'Costo eliminado exitosamente'
        ]);
    }
}
