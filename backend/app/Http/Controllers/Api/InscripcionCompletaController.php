<?php

namespace App\Http\Controllers\Api;

use App\Models\Grado;
use App\Models\Convocatoria;
use App\Models\ConvocatoriaArea;
use App\Models\AreaCompetencia;
use Illuminate\Http\Request;
use App\Models\UnidadEducativa;
use App\Models\ConvocatoriaNivel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Http\JsonResponse;
use App\Mail\CodigoUnicoPago;

use App\Http\Requests\CheckEstudiantesInscritosRequest;
use App\Services\InscripcionCheckerService;
use App\Http\Requests\StoreInscripcionCompletaRequest;
use App\Services\InscripcionService;
use App\Http\Resources\ConvocatoriaResource;
use App\Http\Resources\GradoResource;
use App\Http\Requests\SearchUnidadesEducativasRequest;
use App\Http\Resources\UnidadEducativaResource;

class InscripcionCompletaController extends ApiController
{
    protected $inscripcionCheckerService;
    protected $inscripcionService;

    public function __construct(
        InscripcionCheckerService $inscripcionCheckerService,
        InscripcionService $inscripcionService
    ) {
        $this->inscripcionCheckerService = $inscripcionCheckerService;
        $this->inscripcionService = $inscripcionService;
    }
    /**
     * Obtiene las áreas y niveles disponibles según el grado seleccionado
     */
    public function getAreasPorGrado(Request $request)
    {
        $idGrado = $request->id_grado;
        $idConvocatoria = $request->id_convocatoria;

        // Obtener la convocatoria para verificar el máximo de áreas permitidas
        $convocatoria = Convocatoria::find($idConvocatoria);
        if (!$convocatoria) {
            return $this->errorResponse('Convocatoria no encontrada', 404);
        }

        // Verificar que la convocatoria esté abierta
        if ($convocatoria->estado !== 'abierta') {
            return $this->errorResponse('La convocatoria no está abierta para inscripciones', 422);
        }

        // Obtener las áreas y niveles disponibles para el grado seleccionado
        $areasNiveles = ConvocatoriaNivel::forGradoAndConvocatoria($idGrado, $idConvocatoria)
            ->with(['convocatoriaArea.area', 'nivel'])
            ->get()
            ->map(function ($nivel) {
                return [
                    'id_convocatoria_nivel' => $nivel->id_convocatoria_nivel,
                    'area' => [
                        'id' => $nivel->convocatoriaArea->area->id_area,
                        'nombre' => $nivel->convocatoriaArea->area->nombre_area,
                    ],
                    'nivel' => [
                        'id' => $nivel->nivel->id_nivel,
                        'nombre' => $nivel->nivel->nombre_nivel,
                    ],
                    'costo' => $nivel->convocatoriaArea->costo_inscripcion,
                ];
            });

        return $this->successResponse([
            'areas_niveles' => $areasNiveles,
            'max_areas_permitidas' => $convocatoria->max_areas_por_estudiante
        ], 'Áreas y niveles obtenidos correctamente');
    }

    public function estudianteEstaInscrito(CheckEstudiantesInscritosRequest $request): JsonResponse
    {
        $convocatoria = Convocatoria::find($request->id_convocatoria);
        if (!$convocatoria || $convocatoria->estado !== 'abierta') {
            return $this->errorResponse('La convocatoria no está abierta para inscripciones', 422);
        }

        $erroresInscripcion = $this->inscripcionCheckerService->checkStudentsForInscripcion(
            $request->lista_inscripcion,
            $convocatoria
        );

        if (!empty($erroresInscripcion)) {
            return $this->errorResponse('No se pudieron inscribir algunos estudiantes debido a los siguientes errores:', 422, $erroresInscripcion);
        }

        return $this->successResponse(null, 'Todos los estudiantes pueden ser inscritos sin problemas de duplicidad o límites de áreas.', 200);
    }
    
    public function inscribirEstudiante(StoreInscripcionCompletaRequest $request): JsonResponse
    {
        Log::info(__FUNCTION__);

        $convocatoria = Convocatoria::find($request->id_convocatoria);
        if (!$convocatoria || $convocatoria->estado !== 'abierta') {
            return $this->errorResponse('La convocatoria no está abierta para inscripciones', 422);
        }

        try {
            // Llama al servicio para procesar toda la lógica de inscripción
            $result = $this->inscripcionService->processInscripcion($request->validated(), $convocatoria);

            // Enviar correo electrónico
            Mail::to($result['encargado_pago']->email)->send(new CodigoUnicoPago(
                $result['orden_pago']->codigo_unico,
                $result['encargado_pago']->nombres
            ));

            return $this->successResponse([
                'inscripciones' => $result['lista_inscripcion'],
                'orden_pago' => $result['orden_pago'],
            ], 'Inscripción completada correctamente', 201);

        } catch (\Exception $e) {
            Log::error('Error al procesar la inscripción: ' . $e->getMessage() . ' en ' . $e->getFile() . ' línea ' . $e->getLine());
            return $this->errorResponse('Error al procesar la inscripción: ' . $e->getMessage(), 500);
        }
    }

    public function estaInscritoArea($ci_estudiante, $id_categoria_nivel)
    {
       $inscripcion = DB::select('
        SELECT id_detalle
        FROM detalles_lista_inscripcion dli, estudiantes e
        WHERE dli.id_estudiante = e.id_estudiante
        AND e.ci = ?
        AND dli.id_convocatoria_nivel = ?
        ' , [$ci_estudiante, $id_categoria_nivel] );

        return !empty($inscripcion);
    }

    public function getNombreArea($id_categoria_nivel){
        $id_convocatoria_area =  ConvocatoriaNivel::where('id_convocatoria_nivel', $id_categoria_nivel)
                                                ->value('id_convocatoria_area');
        $id_area = ConvocatoriaArea::where('id_convocatoria_area', $id_convocatoria_area)
                                ->value('id_area');
        $nom_area = AreaCompetencia::where('id_area', $id_area)
                                ->value('nombre_area');
        return $nom_area;
    }
    /**
     * Obtiene los datos necesarios para el formulario de inscripción
     */
    public function getDatosInscripcion(): JsonResponse
    {
        $convocatoria = Convocatoria::activa()->first(); // Usando el scope

        if (!$convocatoria) {
            return $this->errorResponse('No hay convocatorias abiertas actualmente', 404);
        }

        $grados = Grado::orderBy('orden')->get();

        return $this->successResponse([
            'convocatoria' => new ConvocatoriaResource($convocatoria),
            'grados' => GradoResource::collection($grados),
        ], 'Datos para inscripción obtenidos correctamente');
    }

    /**
     * Busca unidades educativas por nombre
     */
    public function buscarUnidadesEducativas(SearchUnidadesEducativasRequest $request): JsonResponse
    {
        $query = $request->query('query');
        $unidades = UnidadEducativa::search($query) // Usando el scope
            ->limit(10)
            ->get();

        return $this->successResponse(
            UnidadEducativaResource::collection($unidades),
            'Unidades educativas encontradas'
        );
    }
}