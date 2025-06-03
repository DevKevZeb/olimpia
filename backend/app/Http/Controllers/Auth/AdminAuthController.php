<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AdminAuthController extends Controller
{
    /**
     * Autenticar administrador
     */
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string|min:6',
        ], [
            'email.required' => 'El correo electrónico es requerido',
            'email.email' => 'El correo electrónico debe tener un formato válido',
            'password.required' => 'La contraseña es requerida',
            'password.min' => 'La contraseña debe tener al menos 6 caracteres',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $admin = Admin::where('email', $request->email)
            ->where('activo', true)
            ->first();

        if (!$admin || !Hash::check($request->password, $admin->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Credenciales incorrectas',
            ], 401);
        }

        // Eliminar tokens anteriores
        $admin->tokens()->delete();

        // Crear nuevo token
        $token = $admin->createToken('admin-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login exitoso',
            'data' => [
                'admin' => [
                    'id' => $admin->id,
                    'nombre' => $admin->nombre,
                    'email' => $admin->email,
                ],
                'token' => $token,
            ],
        ]);
    }

    /**
     * Cerrar sesión
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Sesión cerrada correctamente',
        ]);
    }

    /**
     * Obtener información del administrador autenticado
     */
    public function profile(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'admin' => [
                    'id' => $request->user()->id,
                    'nombre' => $request->user()->nombre,
                    'email' => $request->user()->email,
                ],
            ],
        ]);
    }

    /**
     * Verificar si el token es válido
     */
    public function checkAuth(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'authenticated' => true,
            'data' => [
                'admin' => [
                    'id' => $request->user()->id,
                    'nombre' => $request->user()->nombre,
                    'email' => $request->user()->email,
                ],
            ],
        ]);
    }
}
