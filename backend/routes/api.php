<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AreasCompetenciaController;
use App\Http\Controllers\Api\ConvocatoriaController;
use App\Http\Controllers\Api\EstudianteController;
use App\Http\Controllers\Api\UnidadEducativaController;
use App\Http\Controllers\Api\GradoController;
use App\Http\Controllers\Api\NivelCategoriaController;
use App\Http\Controllers\Api\TutorLegalController;
use App\Http\Controllers\Api\TutorAcademicoController;
use App\Http\Controllers\Api\ListaInscripcionController;
use App\Http\Controllers\Api\OrdenPagoController;
use App\Http\Controllers\Api\ComprobantePagoController;
use App\Http\Controllers\Api\ConvocatoriaAreaController;
use App\Http\Controllers\Api\ConvocatoriaNivelController;
use App\Http\Controllers\Api\PublicConvocatoriaController;
use App\Http\Controllers\Api\InscripcionCompletaController;
use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\Api\AdminConvocatoriaControllerRefactored;
use App\Http\Controllers\Api\RequisitoConvocatoriaController;
use App\Http\Controllers\Api\ExcelController;
use App\Http\Controllers\Api\ConvocatoriaConfigController;
use App\Http\Controllers\Api\ReportesInscripcion;
use App\Http\Controllers\Api\ReporteEstudiantesConvocatoriaController;
use App\Http\Controllers\Api\AmpliarFechaController;
use App\Http\Controllers\Api\AreaController;
use App\Http\Controllers\Api\EstadoInscripcionController;
use App\Http\Controllers\Api\DocumentoController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\HomeController;
use App\Http\Controllers\Auth\AdminAuthController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Rutas públicas: inscripción, consulta de estado, boleta de pago y
| catálogos de solo lectura. Todo lo demás requiere el token del
| administrador (auth:sanctum).
|
*/

/*
|--------------------------------------------------------------------------
| Admin Authentication Routes
|--------------------------------------------------------------------------
*/
Route::prefix('admin')->group(function () {
    Route::post('/login', [AdminAuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AdminAuthController::class, 'logout']);
        Route::get('/profile', [AdminAuthController::class, 'profile']);
        Route::get('/check-auth', [AdminAuthController::class, 'checkAuth']);
        Route::get('/login-statistics', [AdminAuthController::class, 'getLoginStatistics']);
    });
});

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
Route::get('/areas-de-convocatoria', [HomeController::class, 'areasDeConvocatoriaActiva']);
Route::get('/area/{idArea}/documento', [HomeController::class, 'documentoDeArea']);
Route::get('/estado-inscripcion/{ci}', [EstadoInscripcionController::class, 'show']);
Route::get('/documentos/descargar/{id_area}', [DocumentoController::class, 'descargarDocumento']);

Route::prefix('v1')->group(function () {
    // Catálogos de solo lectura
    Route::apiResource('areas', AreasCompetenciaController::class)->only(['index', 'show']);
    Route::apiResource('convocatorias', ConvocatoriaController::class)->only(['index', 'show']);
    Route::apiResource('convocatoria-areas', ConvocatoriaAreaController::class)->only(['index', 'show']);
    Route::apiResource('convocatoria-niveles', ConvocatoriaNivelController::class)->only(['index', 'show']);
    Route::get('grados/por-nombre/{nombre_grado}', [GradoController::class, 'showPorNombre']);
    Route::apiResource('grados', GradoController::class)->only(['index', 'show']);
    Route::apiResource('niveles', NivelCategoriaController::class)->only(['index', 'show']);
    Route::get('convocatorias/{convocatoria}/requisitos', [RequisitoConvocatoriaController::class, 'index'])->name('convocatorias.requisitos.index');

    // Página Home
    Route::get('/public/convocatoria-actual', [PublicConvocatoriaController::class, 'getConvocatoriaActual']);

    // Página de Inscripción
    Route::get('/public/datos-inscripcion', [InscripcionCompletaController::class, 'getDatosInscripcion']);
    Route::get('/public/unidades-educativas/buscar', [InscripcionCompletaController::class, 'buscarUnidadesEducativas']);
    Route::post('/public/areas-por-grado', [InscripcionCompletaController::class, 'getAreasPorGrado']);
    Route::post('/public/inscripcion-completa', [InscripcionCompletaController::class, 'inscribirEstudiante']);
    Route::post('/public/estudiante-esta-inscrito', [InscripcionCompletaController::class, 'estudianteEstaInscrito']);
    Route::get('search-by-ci', [SearchController::class, 'searchByCI']);
    Route::get('show/{ci}', [EstudianteController::class, 'showWithJoins']);

    // Inscripción por Excel
    Route::get('/excel/plantilla/{id_convocatoria}', [ExcelController::class, 'downloadTemplate']);
    Route::get('/convocatorianiveles/{id_convocatoria}', [ConvocatoriaConfigController::class, 'getAllConvocatoriaNiveles']);

    // Boleta y comprobante de pago
    Route::get('ordenes-pago/descargar/{codigo}', [OrdenPagoController::class, 'getByCode']);
    Route::post('comprobantes-pago/por-codigo', [ComprobantePagoController::class, 'storeByCodigoOrden']);
    Route::post('comprobantes-pago/verificar-codigo', [ComprobantePagoController::class, 'verificarCodigoOrden']);
});

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::get('/areas', [AreaController::class, 'index']);
    Route::post('/areas', [AreaController::class, 'store']);
    Route::get('/convocatorias', [AmpliarFechaController::class, 'index']);
    Route::put('/convocatorias/{id}/ampliar-fecha', [AmpliarFechaController::class, 'actualizarFecha']);
    Route::get('/convocatorias/{id}/areas', [DocumentoController::class, 'obtenerAreasPorConvocatoria']);
    Route::post('/documentos/subir', [DocumentoController::class, 'subirDocumento']);

    Route::prefix('v1')->group(function () {
        // Escritura de catálogos
        Route::apiResource('areas', AreasCompetenciaController::class)->except(['index', 'show']);
        Route::apiResource('convocatorias', ConvocatoriaController::class)->except(['index', 'show']);
        Route::apiResource('convocatoria-areas', ConvocatoriaAreaController::class)->except(['index', 'show']);
        Route::apiResource('convocatoria-niveles', ConvocatoriaNivelController::class)->except(['index', 'show']);
        Route::apiResource('grados', GradoController::class)->except(['index', 'show']);
        Route::apiResource('niveles', NivelCategoriaController::class)->except(['index', 'show']);
        Route::post('convocatorias/{convocatoria}/requisitos', [RequisitoConvocatoriaController::class, 'store'])->name('convocatorias.requisitos.store');

        // Estudiantes, tutores e inscripciones
        Route::get('estudiantes/search', [EstudianteController::class, 'search']);
        Route::apiResource('estudiantes', EstudianteController::class);
        Route::apiResource('unidades-educativas', UnidadEducativaController::class);
        Route::apiResource('tutores-legales', TutorLegalController::class);
        Route::apiResource('tutores-academicos', TutorAcademicoController::class);
        Route::apiResource('listas-inscripcion', ListaInscripcionController::class);
        Route::post('listas-inscripcion/{id}/detalles', [ListaInscripcionController::class, 'addDetail']);
        Route::delete('listas-inscripcion/{id}/detalles/{detalleId}', [ListaInscripcionController::class, 'removeDetail']);

        // Pagos
        Route::apiResource('ordenes-pago', OrdenPagoController::class);
        Route::apiResource('comprobantes-pago', ComprobantePagoController::class);
        Route::get('comprobantes-pago/{id}/download', [ComprobantePagoController::class, 'downloadPdf']);

        // Panel de administración
        Route::get('/admin/dashboard-data', [AdminDashboardController::class, 'index']);
        Route::get('/admin/convocatorias', [AdminConvocatoriaControllerRefactored::class, 'getAllConvocatorias']);
        Route::get('/admin/convocatorias-activas', [AdminConvocatoriaControllerRefactored::class, 'getConvocatoriasActivas']);
        Route::get('/admin/convocatorias-planificadas', [AdminConvocatoriaControllerRefactored::class, 'getConvocatoriasPlanificadas']);
        Route::get('/admin/areas-competencia', [AdminConvocatoriaControllerRefactored::class, 'getAreasCompetencia']);
        Route::get('/admin/niveles-categoria', [AdminConvocatoriaControllerRefactored::class, 'getNivelesCategoria']);
        Route::get('/admin/grados', [AdminConvocatoriaControllerRefactored::class, 'getGrados']);
        Route::post('/admin/convocatorias', [AdminConvocatoriaControllerRefactored::class, 'crearConvocatoria']);
        Route::post('/admin/convocatorias/asociar-areas', [AdminConvocatoriaControllerRefactored::class, 'asociarAreas']);
        Route::post('/admin/convocatorias/asociar-niveles-grados', [AdminConvocatoriaControllerRefactored::class, 'asociarNivelesGrados']);
        Route::post('/admin/convocatorias/cerrar-expiradas', [AdminConvocatoriaControllerRefactored::class, 'cerrarConvocatoriasExpiradas']);
        Route::post('/admin/convocatorias/{idConvocatoria}/set-costo-general', [ConvocatoriaAreaController::class, 'setCostoGeneral']);
        Route::get('/admin/convocatorias/{id}/areas', [AdminConvocatoriaControllerRefactored::class, 'getAreasPorConvocatoria']);
        Route::get('/admin/convocatorias/{id}/niveles', [AdminConvocatoriaControllerRefactored::class, 'getNivelesPorConvocatoria']);
        Route::get('/admin/convocatorias/{id}/niveles/{area}', [AdminConvocatoriaControllerRefactored::class, 'getNivelesPorConvocatoria']);
        Route::get('/admin/convocatorias/{id}/estado', [AdminConvocatoriaControllerRefactored::class, 'getEstadoConvocatoria']);
        Route::put('/admin/convocatorias/{id}/estado', [AdminConvocatoriaControllerRefactored::class, 'transicionarEstado']);

        // Reportes: las rutas fijas van antes que la genérica /reportes/{campo}/{id}
        Route::get('/reportes/estudiantes-por-convocatoria', [ReporteEstudiantesConvocatoriaController::class, 'index']);
        Route::get('/reportes/inscritos-por-area', [ReporteEstudiantesConvocatoriaController::class, 'inscritosPorArea']);
        Route::get('/reportes/inscritos-por-departamento', [ReporteEstudiantesConvocatoriaController::class, 'inscritosPorDepartamento']);
        Route::get('/reportes/{campo}/{id}', [ReportesInscripcion::class, 'GetReporte']);
    });
});
