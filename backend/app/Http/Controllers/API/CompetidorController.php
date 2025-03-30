<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Competidor;
use App\Models\Grado;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CompetidorController extends Controller
{
    public function index()
    {
        $competidores = Competidor::with('grado')->get();
        return response()->json([
            'status' => 'success',
            'data' => $competidores
        ]);
    }
    
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:100',
            'apellido' => 'required|string|max:100',
            'email' => 'nullable|email|max:100',
            'ci' => 'required|string|max:20|unique:Competidor,ci',
            'fecha_nacimiento' => 'required|date',
            'colegio' => 'required|string|max:100',
            'Id_grado' => 'required|exists:Grado,Id_grado',
            'departamento' => 'nullable|string|max:100',
            'provincia' => 'nullable|string|max:100'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()
            ], 400);
        }
        
        $competidor = Competidor::create($request->all());
        
        return response()->json([
            'status' => 'success',
            'message' => 'Competidor creado exitosamente',
            'data' => $competidor
        ], 201);
    }
    
    public function show($id)
    {
        $competidor = Competidor::with('grado')->find($id);
        
        if (!$competidor) {
            return response()->json([
                'status' => 'error',
                'message' => 'Competidor no encontrado'
            ], 404);
        }
        
        return response()->json([
            'status' => 'success',
            'data' => $competidor
        ]);
    }
    
    public function update(Request $request, $id)
    {
        $competidor = Competidor::find($id);
        
        if (!$competidor) {
            return response()->json([
                'status' => 'error',
                'message' => 'Competidor no encontrado'
            ], 404);
        }
        
        $validator = Validator::make($request->all(), [
            'nombre' => 'sometimes|required|string|max:100',
            'apellido' => 'sometimes|required|string|max:100',
            'email' => 'nullable|email|max:100',
            'ci' => 'sometimes|required|string|max:20|unique:Competidor,ci,' . $id . ',Id_competidor',
            'fecha_nacimiento' => 'sometimes|required|date',
            'colegio' => 'sometimes|required|string|max:100',
            'Id_grado' => 'sometimes|required|exists:Grado,Id_grado',
            'departamento' => 'nullable|string|max:100',
            'provincia' => 'nullable|string|max:100'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()
            ], 400);
        }
        
        $competidor->update($request->all());
        
        return response()->json([
            'status' => 'success',
            'message' => 'Competidor actualizado exitosamente',
            'data' => $competidor
        ]);
    }
    
    public function destroy($id)
    {
        $competidor = Competidor::find($id);
        
        if (!$competidor) {
            return response()->json([
                'status' => 'error',
                'message' => 'Competidor no encontrado'
            ], 404);
        }
        
        $competidor->delete();
        
        return response()->json([
            'status' => 'success',
            'message' => 'Competidor eliminado exitosamente'
        ]);
    }
}
