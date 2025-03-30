<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Rol;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RolController extends Controller
{
    public function index()
    {
        $roles = Rol::all();
        return response()->json([
            'status' => 'success',
            'data' => $roles
        ]);
    }
    
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|unique:Rol,nombre|max:20'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()
            ], 400);
        }
        
        $rol = Rol::create($request->all());
        
        return response()->json([
            'status' => 'success',
            'message' => 'Rol creado exitosamente',
            'data' => $rol
        ], 201);
    }
    
    public function show($id)
    {
        $rol = Rol::find($id);
        
        if (!$rol) {
            return response()->json([
                'status' => 'error',
                'message' => 'Rol no encontrado'
            ], 404);
        }
        
        return response()->json([
            'status' => 'success',
            'data' => $rol
        ]);
    }
    
    public function update(Request $request, $id)
    {
        $rol = Rol::find($id);
        
        if (!$rol) {
            return response()->json([
                'status' => 'error',
                'message' => 'Rol no encontrado'
            ], 404);
        }
        
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|max:20|unique:Rol,nombre,' . $id . ',Id_rol'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()
            ], 400);
        }
        
        $rol->update($request->all());
        
        return response()->json([
            'status' => 'success',
            'message' => 'Rol actualizado exitosamente',
            'data' => $rol
        ]);
    }
    
    public function destroy($id)
    {
        $rol = Rol::find($id);
        
        if (!$rol) {
            return response()->json([
                'status' => 'error',
                'message' => 'Rol no encontrado'
            ], 404);
        }
        
        $rol->delete();
        
        return response()->json([
            'status' => 'success',
            'message' => 'Rol eliminado exitosamente'
        ]);
    }
}
