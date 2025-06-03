<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\LoginAttempt;
use App\Rules\StrongPassword;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class AdminAuthController extends Controller
{
    /**
     * Autenticar administrador
     */
    public function login(Request $request): JsonResponse
    {
        $ipAddress = $request->ip();
        $userAgent = $request->userAgent();

        // 1. Verificar rate limiting por IP
        if (LoginAttempt::isBlocked($ipAddress)) {
            LoginAttempt::recordAttempt($ipAddress, $request->email, false, $userAgent);
            
            return response()->json([
                'success' => false,
                'message' => 'Demasiados intentos de login. Intenta nuevamente en 15 minutos.',
            ], 429);
        }

        // 2. Validar entrada
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
            LoginAttempt::recordAttempt($ipAddress, $request->email, false, $userAgent);
            
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        // 3. Verificar credenciales
        $admin = Admin::where('email', $request->email)
            ->where('activo', true)
            ->first();

        if (!$admin || !Hash::check($request->password, $admin->password)) {
            LoginAttempt::recordAttempt($ipAddress, $request->email, false, $userAgent);
            
            return response()->json([
                'success' => false,
                'message' => 'Credenciales incorrectas',
            ], 401);
        }

        // 4. Login exitoso
        // Eliminar tokens anteriores
        $admin->tokens()->delete();

        // Crear nuevo token con expiración
        $token = $admin->createToken('admin-token', ['*'], Carbon::now()->addHours(8))->plainTextToken;

        // Registrar intento exitoso
        LoginAttempt::recordAttempt($ipAddress, $request->email, true, $userAgent);

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
                'expires_at' => Carbon::now()->addHours(8)->toISOString(),
            ],
        ]);
    }

    /**
     * Cerrar sesión
     */
    public function logout(Request $request): JsonResponse
    {
        // Registrar el cierre de sesión
        $ipAddress = $request->ip();
        $userAgent = $request->userAgent();
        
        // Eliminar el token actual
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

    /**
     * Obtener estadísticas de seguridad de login
     */
    public function getLoginStatistics(Request $request): JsonResponse
    {
        $now = Carbon::now();
        $last24Hours = $now->copy()->subDay();
        $last7Days = $now->copy()->subWeek();
        $last30Days = $now->copy()->subMonth();

        // Estadísticas de las últimas 24 horas
        $stats24h = [
            'total_attempts' => LoginAttempt::where('created_at', '>=', $last24Hours)->count(),
            'successful_logins' => LoginAttempt::where('created_at', '>=', $last24Hours)
                ->where('successful', true)->count(),
            'failed_attempts' => LoginAttempt::where('created_at', '>=', $last24Hours)
                ->where('successful', false)->count(),
            'unique_ips' => LoginAttempt::where('created_at', '>=', $last24Hours)
                ->distinct('ip_address')->count(),
        ];

        // Estadísticas de los últimos 7 días
        $stats7d = [
            'total_attempts' => LoginAttempt::where('created_at', '>=', $last7Days)->count(),
            'successful_logins' => LoginAttempt::where('created_at', '>=', $last7Days)
                ->where('successful', true)->count(),
            'failed_attempts' => LoginAttempt::where('created_at', '>=', $last7Days)
                ->where('successful', false)->count(),
            'unique_ips' => LoginAttempt::where('created_at', '>=', $last7Days)
                ->distinct('ip_address')->count(),
        ];

        // Estadísticas de los últimos 30 días
        $stats30d = [
            'total_attempts' => LoginAttempt::where('created_at', '>=', $last30Days)->count(),
            'successful_logins' => LoginAttempt::where('created_at', '>=', $last30Days)
                ->where('successful', true)->count(),
            'failed_attempts' => LoginAttempt::where('created_at', '>=', $last30Days)
                ->where('successful', false)->count(),
            'unique_ips' => LoginAttempt::where('created_at', '>=', $last30Days)
                ->distinct('ip_address')->count(),
        ];

        // IPs actualmente bloqueadas
        $blockedIps = LoginAttempt::where('successful', false)
            ->where('created_at', '>=', $now->copy()->subMinutes(15))
            ->select('ip_address')
            ->groupBy('ip_address')
            ->havingRaw('COUNT(*) >= 5')
            ->pluck('ip_address');

        // Intentos recientes (últimas 2 horas)
        $recentAttempts = LoginAttempt::where('created_at', '>=', $now->copy()->subHours(2))
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get()
            ->map(function ($attempt) {
                return [
                    'id' => $attempt->id,
                    'ip_address' => $attempt->ip_address,
                    'email' => $attempt->email,
                    'successful' => $attempt->successful,
                    'user_agent' => $attempt->user_agent,
                    'created_at' => $attempt->created_at->format('Y-m-d H:i:s'),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'last_24_hours' => $stats24h,
                'last_7_days' => $stats7d,
                'last_30_days' => $stats30d,
                'blocked_ips' => $blockedIps,
                'recent_attempts' => $recentAttempts,
                'generated_at' => $now->format('Y-m-d H:i:s'),
            ],
        ]);
    }
}
