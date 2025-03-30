<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Usuario;
use App\Models\Rol;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;

class UsuarioController extends Controller
{
    public function index()
    {
        $usuarios = Usuario::with('rol')->get();
        return response()->json([
            'status' => 'success',
            'data' => $usuarios
        ]);
    }
    
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:100',
            'correo' => 'required|email|unique:Usuario,correo|max:100',
            'contraseña' => 'required|string|min:6',
            'Id_rol' => 'required|exists:Rol,Id_rol'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()
            ], 400);
        }
        
        $usuario = new Usuario([
            'nombre' => $request->nombre,
            'correo' => $request->correo,
            'contraseña' => Hash::make($request->contraseña),
            'Id_rol' => $request->Id_rol
        ]);
        
        $usuario->save();
        
        return response()->json([
            'status' => 'success',
            'message' => 'Usuario creado exitosamente',
            'data' => $usuario
        ], 201);
    }
    
    public function show($id)
    {
        $usuario = Usuario::with('rol')->find($id);
        
        if (!$usuario) {
            return response()->json([
                'status' => 'error',
                'message' => 'Usuario no encontrado'
            ], 404);
        }
        
        return response()->json([
            'status' => 'success',
            'data' => $usuario
        ]);
    }
    
    public function update(Request $request, $id)
    {
        $usuario = Usuario::find($id);
        
        if (!$usuario) {
            return response()->json([
                'status' => 'error',
                'message' => 'Usuario no encontrado'
            ], 404);
        }
        
        $validator = Validator::make($request->all(), [
            'nombre' => 'sometimes|required|string|max:100',
            'correo' => 'sometimes|required|email|max:100|unique:Usuario,correo,' . $id . ',Id_usuario',
            'contraseña' => 'sometimes|required|string|min:6',
            'Id_rol' => 'sometimes|required|exists:Rol,Id_rol'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()
            ], 400);
        }
        
        if ($request->has('nombre')) {
            $usuario->nombre = $request->nombre;
        }
        
        if ($request->has('correo')) {
            $usuario->correo = $request->correo;
        }
        
        if ($request->has('contraseña')) {
            $usuario->contraseña = Hash::make($request->contraseña);
        }
        
        if ($request->has('Id_rol')) {
            $usuario->Id_rol = $request->Id_rol;
        }
        
        $usuario->save();
        
        return response()->json([
            'status' => 'success',
            'message' => 'Usuario actualizado exitosamente',
            'data' => $usuario
        ]);
    }
    
    public function destroy($id)
    {
        $usuario = Usuario::find($id);
        
        if (!$usuario) {
            return response()->json([
                'status' => 'error',
                'message' => 'Usuario no encontrado'
            ], 404);
        }
        
        $usuario->delete();
        
        return response()->json([
            'status' => 'success',
            'message' => 'Usuario eliminado exitosamente'
        ]);
    }
}
