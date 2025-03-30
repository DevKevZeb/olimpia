<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Tutor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TutorController extends Controller
{
    public function index()
    {
        $tutores = Tutor::all();
        return response()->json([
            'status' => 'success',
            'data' => $tutores
        ]);
    }
    
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:100',
            'apellido' => 'required|string|max:100',
            'tipo_tutor' => 'required|in:Profesor,Familiar,Estudiante,Otro',
            'telefono' => 'required|string|max:20',
            'email' => 'required|email|max:100'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()
            ], 400);
        }
        
        $tutor = Tutor::create($request->all());
        
        return response()->json([
            'status' => 'success',
            'message' => 'Tutor creado exitosamente',
            'data' => $tutor
        ], 201);
    }
    
    public function show($id)
    {
        $tutor = Tutor::find($id);
        
        if (!$tutor) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tutor no encontrado'
            ], 404);
        }
        
        return response()->json([
            'status' => 'success',
            'data' => $tutor
        ]);
    }
    
    public function update(Request $request, $id)
    {
        $tutor = Tutor::find($id);
        
        if (!$tutor) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tutor no encontrado'
            ], 404);
        }
        
        $validator = Validator::make($request->all(), [
            'nombre' => 'sometimes|required|string|max:100',
            'apellido' => 'sometimes|required|string|max:100',
            'tipo_tutor' => 'sometimes|required|in:Profesor,Familiar,Estudiante,Otro',
            'telefono' => 'sometimes|required|string|max:20',
            'email' => 'sometimes|required|email|max:100'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()
            ], 400);
        }
        
        $tutor->update($request->all());
        
        return response()->json([
            'status' => 'success',
            'message' => 'Tutor actualizado exitosamente',
            'data' => $tutor
        ]);
    }
    
    public function destroy($id)
    {
        $tutor = Tutor::find($id);
        
        if (!$tutor) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tutor no encontrado'
            ], 404);
        }
        
        $tutor->delete();
        
        return response()->json([
            'status' => 'success',
            'message' => 'Tutor eliminado exitosamente'
        ]);
    }
}
