<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AreasCompetenciaController;
use App\Http\Controllers\Api\ConvocatoriaController;
use App\Http\Controllers\Api\EstudianteController;
use App\Http\Controllers\Api\InscripcionController;
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
use App\Http\Controllers\Api\InscripcionDatosController;
use App\Http\Controllers\Api\InscripcionCompletaController;
use App\Http\Controllers\Api\AdminDashboardController;
//use App\Http\Controllers\Api\ConvocatoriaCompletaController;
use App\Http\Controllers\Api\AdminConvocatoriaController;
use App\Http\Controllers\Api\RequisitoConvocatoriaController;
use App\Http\Controllers\Api\ExcelController;
use App\Http\Controllers\Api\BuscarConvocatoriaNivelController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// API v1 Routes
Route::prefix('v1')->group(function () {
    // Areas de Competencia
    Route::apiResource('areas', AreasCompetenciaController::class);

    // Convocatorias
    Route::apiResource('convocatorias', ConvocatoriaController::class);

    // Áreas de Convocatoria
    Route::apiResource('convocatoria-areas', ConvocatoriaAreaController::class);

    // Niveles de Convocatoria
    Route::apiResource('convocatoria-niveles', ConvocatoriaNivelController::class);

    // Estudiantes
    Route::apiResource('estudiantes', EstudianteController::class);
    Route::get('estudiantes/search', [EstudianteController::class, 'search']);
    Route::get('search-by-ci', [EstudianteController::class, 'searchByCI']);
    


    // Inscripciones
    Route::apiResource('inscripciones', InscripcionController::class);

    // Unidades Educativas
    Route::apiResource('unidades-educativas', UnidadEducativaController::class);

    // Grados
    Route::apiResource('grados', GradoController::class);
    Route::get('grados/por-nombre/{nombre_grado}', [GradoController::class, 'showPorNombre']);

    // Niveles de Categoría
    Route::apiResource('niveles', NivelCategoriaController::class);

    // Tutores Legales
    Route::apiResource('tutores-legales', TutorLegalController::class);

    // Tutores Académicos
    Route::apiResource('tutores-academicos', TutorAcademicoController::class);

    // Listas de Inscripción
    Route::apiResource('listas-inscripcion', ListaInscripcionController::class);
    Route::post('listas-inscripcion/{id}/detalles', [ListaInscripcionController::class, 'addDetail']);
    Route::delete('listas-inscripcion/{id}/detalles/{detalleId}', [ListaInscripcionController::class, 'removeDetail']);

    // Órdenes de Pago
    Route::apiResource('ordenes-pago', OrdenPagoController::class);
    Route::get('ordenes-pago/descargar/{codigo}', [OrdenPagoController::class, 'getByCode']);
    // Route::get('ordenes-pago/buscar-por-codigo', [OrdenPagoController::class, 'getByCode']);

    // Comprobantes de Pago
    Route::apiResource('comprobantes-pago', ComprobantePagoController::class);
    Route::get('comprobantes-pago/{id}/download', [ComprobantePagoController::class, 'downloadPdf']);
    Route::post('comprobantes-pago/por-codigo', [ComprobantePagoController::class, 'storeByCodigoOrden']);
    Route::post('comprobantes-pago/verificar-codigo', [ComprobantePagoController::class, 'verificarCodigoOrden']);

    // Nuevos endpoints orientados a páginas/casos de uso

    // Endpoint para página Home
    Route::get('/public/convocatoria-actual', [PublicConvocatoriaController::class, 'getConvocatoriaActual']);

    // Endpoints para página de Inscripción
    Route::get('/public/datos-inscripcion', [InscripcionCompletaController::class, 'getDatosInscripcion']);
    Route::get('/public/unidades-educativas/buscar', [InscripcionCompletaController::class, 'buscarUnidadesEducativas']);
    Route::post('/public/areas-por-grado', [InscripcionCompletaController::class, 'getAreasPorGrado']);
    Route::post('/public/inscripcion-completa', [InscripcionCompletaController::class, 'inscribirEstudiante']);

    // Endpoints para página de Administración
    Route::get('/admin/dashboard-data', [AdminDashboardController::class, 'getDashboardData']);
    //Route::post('/admin/convocatorias/completa', [ConvocatoriaCompletaController::class, 'crearConvocatoriaCompleta']);
    //Route::get('/admin/convocatorias/{id}/completa', [ConvocatoriaCompletaController::class, 'getConvocatoriaCompleta']);

    // Endpoints para el panel de administración de convocatorias
    Route::get('/admin/convocatorias-activas', [AdminConvocatoriaController::class, 'getConvocatoriasActivas']);
    Route::get('/admin/areas-competencia', [AdminConvocatoriaController::class, 'getAreasCompetencia']);
    Route::get('/admin/niveles-categoria', [AdminConvocatoriaController::class, 'getNivelesCategoria']);
    Route::get('/admin/grados', [AdminConvocatoriaController::class, 'getGrados']); // Ruta añadida para obtener grados
    Route::post('/admin/convocatorias', [AdminConvocatoriaController::class, 'crearConvocatoria']);
    Route::post('/admin/convocatorias/asociar-areas', [AdminConvocatoriaController::class, 'asociarAreas']);
    Route::post('/admin/convocatorias/asociar-niveles-grados', [AdminConvocatoriaController::class, 'asociarNivelesGrados']);
    Route::get('/admin/convocatorias/{id}/areas', [AdminConvocatoriaController::class, 'getAreasPorConvocatoria']);
    Route::get('/admin/convocatorias/{id}/niveles', [AdminConvocatoriaController::class, 'getNivelesPorConvocatoria']);

    // Rutas para el controlador de RequisitoConvocatoria
    Route::get('convocatorias/{convocatoria}/requisitos', [RequisitoConvocatoriaController::class, 'index'])->name('convocatorias.requisitos.index');
    Route::post('convocatorias/{convocatoria}/requisitos', [RequisitoConvocatoriaController::class, 'store'])->name('convocatorias.requisitos.store');

    // Rutas para el excel
    Route::get('/excel/plantilla/{id_convocatoria}', [ExcelController::class, 'downloadTemplate']);
    Route::post('/buscar-convocatoria-nivel', [BuscarConvocatoriaNivelController::class, 'buscarIdConvocatoriaNivel']);
});
