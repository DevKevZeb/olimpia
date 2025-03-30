<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AreaController;
use App\Http\Controllers\API\NivelCategoriaController;
use App\Http\Controllers\API\GradoController;
use App\Http\Controllers\API\CostoController;
use App\Http\Controllers\API\TutorController;
use App\Http\Controllers\API\CompetidorController;
use App\Http\Controllers\API\InscripcionController;
use App\Http\Controllers\API\PagoController;
use App\Http\Controllers\API\UsuarioController;
use App\Http\Controllers\API\RolController;
use App\Http\Controllers\API\AuthController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Test endpoint for connectivity check
Route::get('test-connection', function() {
    return response()->json([
        'status' => 'success',
        'message' => 'Conexión exitosa con el backend',
        'timestamp' => now()->toDateTimeString()
    ]);
});

// Test endpoint for areas (public temporary version)
Route::get('test-areas', function() {
    $areas = \App\Models\Area::all();
    return response()->json([
        'status' => 'success',
        'message' => 'Lista de áreas obtenida exitosamente',
        'data' => $areas
    ]);
});

// Public routes
Route::post('login', [AuthController::class, 'login']);

// Temporarily remove auth middleware for testing
// Protected routes
// Route::middleware('auth:api')->group(function () {
    Route::get('user', [AuthController::class, 'user']);
    Route::post('logout', [AuthController::class, 'logout']);
    
    // Admin routes
    Route::apiResource('areas', AreaController::class);
    Route::apiResource('niveles', NivelCategoriaController::class);
    Route::apiResource('grados', GradoController::class);
    Route::apiResource('costos', CostoController::class);
    Route::apiResource('tutores', TutorController::class);
    Route::apiResource('competidores', CompetidorController::class);
    Route::apiResource('inscripciones', InscripcionController::class);
    Route::apiResource('pagos', PagoController::class);
    Route::apiResource('usuarios', UsuarioController::class);
    Route::apiResource('roles', RolController::class);
    
    // Dashboard data
    Route::get('dashboard/stats', [InscripcionController::class, 'getStats']);
// });
