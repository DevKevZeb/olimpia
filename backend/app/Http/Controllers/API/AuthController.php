<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\Usuario;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        // Esta es una implementación simple para pruebas
        // En producción, se requiere una autenticación más robusta
        $validator = Validator::make($request->all(), [
            'correo' => 'required|email',
            'contraseña' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()
            ], 400);
        }

        $usuario = Usuario::where('correo', $request->correo)->first();
        
        if (!$usuario || !Hash::check($request->contraseña, $usuario->contraseña)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Credenciales inválidas'
            ], 401);
        }

        // Generar token básico para pruebas
        $token = base64_encode(random_bytes(64));
        
        return response()->json([
            'status' => 'success',
            'message' => 'Login exitoso',
            'user' => $usuario,
            'access_token' => $token,
            'token_type' => 'Bearer'
        ]);
    }

    public function user(Request $request)
    {
        // Placeholder para obtener el usuario actual
        return response()->json([
            'status' => 'success',
            'data' => $request->user()
        ]);
    }

    public function logout()
    {
        // Placeholder para logout
        return response()->json([
            'status' => 'success',
            'message' => 'Logout exitoso'
        ]);
    }
}
