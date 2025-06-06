<?php

namespace App\Http\Controllers\Api;

use App\Models\Estudiante;
use Illuminate\Http\Request;
use App\Models\TutorAcademico;
use App\Models\UnidadEducativa;
use App\Models\ConvocatoriaArea;
use App\Models\ConvocatoriaNivel;
use Illuminate\Support\Facades\Log;
use App\Models\DetalleListaInscripcion;
use App\Models\OrdenPago; // Importa el modelo OrdenPago

class ReportesInscripcion extends ApiController
{
    public function GetReporte(Request $request)
    {
        $campo = $request->route('campo');
        $id = $request->route('id');
        
        if ($campo == 'convocatoria') {
            return $this->getConvocatoriaData($id);
        }
        
        if($campo == 'departamento'){
            $departamento = $request->query('departamento');
            return $this->getDataPorDepartamento($id,$departamento);
        }

        if($campo == 'genero' ){
            $genero = $request->query('genero');
            return $this->getDataPorGenero($id,$genero);
        }


        if($campo == 'provincia' ){
            $departamento = $request->query('departamento');
            $provincia = $request->query('provincia');
            return $this->getDataPorProvincia($id, $departamento, $provincia);
        }

        if($campo == 'area' ){
            $area_id = $request->query('area_id');
            return $this->getDataPorArea($id,$area_id);
        }

        if($campo == 'nivel' ){
            $area_id = $request->query('area_id');
            $nivel_id = $request->query('nivel_id');
            return $this->getDataPorNivel($id,$area_id,$nivel_id);
        }

        if($campo == 'unidad_educativa' ){
            $unidad_educativa = $request->query('unidad_educativa');
            return $this->getDataPorUnidadEducativa($id,$unidad_educativa);
        }

        return $this->errorResponse('Campo no válido', 400);
    }

    private function getConvocatoriaData($convocatoriaId)
    {
        $convocatoriaAreas = ConvocatoriaArea::where('id_convocatoria', $convocatoriaId)
            ->join('areas_competencia', 'convocatoria_areas.id_area', '=', 'areas_competencia.id_area')
            ->get(['convocatoria_areas.id_convocatoria_area', 'areas_competencia.nombre_area']);

        if ($convocatoriaAreas->isEmpty()) {
            return $this->successResponse([], 'No se encontraron áreas de convocatoria para el ID proporcionado.');
        }

        $resultados = [];
        foreach ($convocatoriaAreas as $convocatoriaArea) {
            $convocatoriaNiveles = ConvocatoriaNivel::where('id_convocatoria_area', $convocatoriaArea->id_convocatoria_area)->get(['id_convocatoria_nivel']);

            if ($convocatoriaNiveles->isEmpty()) {
                continue;
            }

            foreach ($convocatoriaNiveles as $convocatoriaNivel) {
                $listaInscripciones = DetalleListaInscripcion::where('id_convocatoria_nivel', $convocatoriaNivel->id_convocatoria_nivel)
                    ->with(['estudiante' => function ($query) {
                        $query->select(['id_estudiante', 'nombres', 'apellidos', 'ci', 'id_grado', 'id_unidad_educativa', 'id_tutor_legal'])
                            ->with(['grado:id_grado,nombre_grado', 'unidadEducativa:id_unidad_educativa,nombre,departamento', 'tutorLegal:id_tutor_legal,nombres,apellidos,ci']);
                    }])
                    ->select(['id_detalle', 'id_estudiante', 'id_lista', 'fecha_registro']) // Seleccionamos id_lista
                    ->get();

                if ($listaInscripciones->isEmpty()) {
                    continue;
                }

                foreach ($listaInscripciones as $inscripcion) {
                    // Buscar la orden de pago asociada a la lista de inscripción
                    $ordenPago = OrdenPago::where('id_lista', $inscripcion->id_lista)->first();

                    $estadoInscripcion = 'Pendiente'; // Estado por defecto

                    if ($ordenPago) {
                        $estadoInscripcion = $ordenPago->estado;
                    }

                    $resultados[] = [
                        'estudiante' => [
                            'nombres' => $inscripcion->estudiante->nombres ?? null,
                            'apellidos' => $inscripcion->estudiante->apellidos ?? null,
                            'ci' => $inscripcion->estudiante->ci ?? null,
                            'grado' => $inscripcion->estudiante->grado->nombre_grado ?? null,
                            'unidad_educativa' => [
                                'nombre' => $inscripcion->estudiante->unidadEducativa->nombre ?? null,
                                'departamento' => $inscripcion->estudiante->unidadEducativa->departamento ?? null,
                            ],
                            'tutor_legal' => [
                                'nombre' => $inscripcion->estudiante->tutorLegal->nombres ?? null,
                                'apellido' => $inscripcion->estudiante->tutorLegal->apellidos ?? null,
                                'ci' => $inscripcion->estudiante->tutorLegal->ci ?? null,
                            ],
                        ],
                        'estado_inscripcion' => $estadoInscripcion,
                        'areas_inscritas' => $convocatoriaArea->nombre_area ?? null,
                        'fecha_inscripcion' => $inscripcion->fecha_registro ?? null, // Usamos fecha_registro de detalles_lista_inscripcion
                    ];
                }
            }
        }

        return $this->successResponse($resultados, 'Datos de la convocatoria obtenidos exitosamente.');
    }

     private function getDataPorDepartamento($convocatoriaId, $departamento)
    {
        $convocatoriaAreas = ConvocatoriaArea::where('id_convocatoria', $convocatoriaId)
            ->join('areas_competencia', 'convocatoria_areas.id_area', '=', 'areas_competencia.id_area')
            ->get(['convocatoria_areas.id_convocatoria_area', 'areas_competencia.nombre_area']);

        if ($convocatoriaAreas->isEmpty()) {
            return $this->successResponse([], 'No se encontraron áreas de convocatoria para el ID proporcionado.');
        }

        $resultados = [];
        foreach ($convocatoriaAreas as $convocatoriaArea) {
            $convocatoriaNiveles = ConvocatoriaNivel::where('id_convocatoria_area', $convocatoriaArea->id_convocatoria_area)->get(['id_convocatoria_nivel']);

            if ($convocatoriaNiveles->isEmpty()) {
                continue;
            }

            foreach ($convocatoriaNiveles as $convocatoriaNivel) {
                $listaInscripciones = DetalleListaInscripcion::where('id_convocatoria_nivel', $convocatoriaNivel->id_convocatoria_nivel)
                    ->with(['estudiante' => function ($query) {
                        $query->select(['id_estudiante', 'nombres', 'apellidos', 'ci', 'id_grado', 'id_unidad_educativa', 'id_tutor_legal'])
                            ->with(['grado:id_grado,nombre_grado', 'unidadEducativa:id_unidad_educativa,nombre,departamento', 'tutorLegal:id_tutor_legal,nombres,apellidos,ci']);
                    }])
                    ->select(['id_detalle', 'id_estudiante', 'id_lista', 'fecha_registro']) // Seleccionamos id_lista
                    ->get();

                if ($listaInscripciones->isEmpty()) {
                    continue;
                }

                foreach ($listaInscripciones as $inscripcion) {
                    // Buscar la orden de pago asociada a la lista de inscripción
                    $ordenPago = OrdenPago::where('id_lista', $inscripcion->id_lista)->first();

                    $estadoInscripcion = 'Pendiente'; // Estado por defecto

                    if ($ordenPago) {
                        $estadoInscripcion = $ordenPago->estado;
                    }
                    if($inscripcion->estudiante->unidadEducativa->departamento !== $departamento)
                    {
                        continue;
                    }
                    $resultados[] = [
                        'estudiante' => [
                            'nombres' => $inscripcion->estudiante->nombres ?? null,
                            'apellidos' => $inscripcion->estudiante->apellidos ?? null,
                            'ci' => $inscripcion->estudiante->ci ?? null,
                            'grado' => $inscripcion->estudiante->grado->nombre_grado ?? null,
                            'unidad_educativa' => [
                                'nombre' => $inscripcion->estudiante->unidadEducativa->nombre ?? null,
                                'departamento' => $inscripcion->estudiante->unidadEducativa->departamento ?? null,
                            ],
                            'tutor_legal' => [
                                'nombre' => $inscripcion->estudiante->tutorLegal->nombres ?? null,
                                'apellido' => $inscripcion->estudiante->tutorLegal->apellidos ?? null,
                                'ci' => $inscripcion->estudiante->tutorLegal->ci ?? null,
                            ],
                        ],
                        'estado_inscripcion' => $estadoInscripcion,
                        'areas_inscritas' => $convocatoriaArea->nombre_area ?? null,
                        'fecha_inscripcion' => $inscripcion->fecha_registro ?? null, // Usamos fecha_registro de detalles_lista_inscripcion
                    ];
                }
            }
        }
        return $this->successResponse($resultados, 'Datos de la convocatoria obtenidos exitosamente.');
    }

         private function getDataPorGenero($convocatoriaId, $genero)
    {
        $convocatoriaAreas = ConvocatoriaArea::where('id_convocatoria', $convocatoriaId)
            ->join('areas_competencia', 'convocatoria_areas.id_area', '=', 'areas_competencia.id_area')
            ->get(['convocatoria_areas.id_convocatoria_area', 'areas_competencia.nombre_area']);

        if ($convocatoriaAreas->isEmpty()) {
            return $this->successResponse([], 'No se encontraron áreas de convocatoria para el ID proporcionado.');
        }

        $resultados = [];
        foreach ($convocatoriaAreas as $convocatoriaArea) {
            $convocatoriaNiveles = ConvocatoriaNivel::where('id_convocatoria_area', $convocatoriaArea->id_convocatoria_area)->get(['id_convocatoria_nivel']);

            if ($convocatoriaNiveles->isEmpty()) {
                continue;
            }

            foreach ($convocatoriaNiveles as $convocatoriaNivel) {
                $listaInscripciones = DetalleListaInscripcion::where('id_convocatoria_nivel', $convocatoriaNivel->id_convocatoria_nivel)
                    ->with(['estudiante' => function ($query) {
                        $query->select(['id_estudiante', 'nombres', 'apellidos', 'ci', 'id_grado', 'id_unidad_educativa', 'id_tutor_legal','genero'])
                            ->with(['grado:id_grado,nombre_grado', 'unidadEducativa:id_unidad_educativa,nombre,departamento', 'tutorLegal:id_tutor_legal,nombres,apellidos,ci']);
                    }])
                    ->select(['id_detalle', 'id_estudiante', 'id_lista', 'fecha_registro']) // Seleccionamos id_lista
                    ->get();

                if ($listaInscripciones->isEmpty()) {
                    continue;
                }

                foreach ($listaInscripciones as $inscripcion) {
                    // Buscar la orden de pago asociada a la lista de inscripción
                    $ordenPago = OrdenPago::where('id_lista', $inscripcion->id_lista)->first();

                    $estadoInscripcion = 'Pendiente'; // Estado por defecto

                    if ($ordenPago) {
                        $estadoInscripcion = $ordenPago->estado;
                    }
                    Log::info($inscripcion->estudiante->genero . " -- " . $genero );
                    if(
                        $genero == 'Otro' &&
                        ($inscripcion->estudiante->genero == 'Femenino' || 
                        $inscripcion->estudiante->genero == 'Masculino')  
                        )
                        {
                        Log::info("SKIIP" );
                        continue; 
                    }else if($genero != 'Otro' && $inscripcion->estudiante->genero !== $genero)
                    {
                        continue;
                    }
                    $resultados[] = [
                        'estudiante' => [
                            'nombres' => $inscripcion->estudiante->nombres ?? null,
                            'apellidos' => $inscripcion->estudiante->apellidos ?? null,
                            'ci' => $inscripcion->estudiante->ci ?? null,
                            'grado' => $inscripcion->estudiante->grado->nombre_grado ?? null,
                            'unidad_educativa' => [
                                'nombre' => $inscripcion->estudiante->unidadEducativa->nombre ?? null,
                                'departamento' => $inscripcion->estudiante->unidadEducativa->departamento ?? null,
                            ],
                            'tutor_legal' => [
                                'nombre' => $inscripcion->estudiante->tutorLegal->nombres ?? null,
                                'apellido' => $inscripcion->estudiante->tutorLegal->apellidos ?? null,
                                'ci' => $inscripcion->estudiante->tutorLegal->ci ?? null,
                            ],
                        ],
                        'estado_inscripcion' => $estadoInscripcion,
                        'areas_inscritas' => $convocatoriaArea->nombre_area ?? null,
                        'fecha_inscripcion' => $inscripcion->fecha_registro ?? null, // Usamos fecha_registro de detalles_lista_inscripcion
                    ];
                }
            }
        }
        return $this->successResponse($resultados, 'Datos de la convocatoria obtenidos exitosamente.');
    }

    private function getDataPorProvincia($convocatoriaId, $departamento, $provincia)
    {
        $convocatoriaAreas = ConvocatoriaArea::where('id_convocatoria', $convocatoriaId)
            ->join('areas_competencia', 'convocatoria_areas.id_area', '=', 'areas_competencia.id_area')
            ->get(['convocatoria_areas.id_convocatoria_area', 'areas_competencia.nombre_area']);

        if ($convocatoriaAreas->isEmpty()) {
            return $this->successResponse([], 'No se encontraron áreas de convocatoria para el ID proporcionado.');
        }

        $resultados = [];
        foreach ($convocatoriaAreas as $convocatoriaArea) {
            $convocatoriaNiveles = ConvocatoriaNivel::where('id_convocatoria_area', $convocatoriaArea->id_convocatoria_area)->get(['id_convocatoria_nivel']);

            if ($convocatoriaNiveles->isEmpty()) {
                continue;
            }

            foreach ($convocatoriaNiveles as $convocatoriaNivel) {
                $listaInscripciones = DetalleListaInscripcion::where('id_convocatoria_nivel', $convocatoriaNivel->id_convocatoria_nivel)
                    ->with(['estudiante' => function ($query) {
                        $query->select(['id_estudiante', 'nombres', 'apellidos', 'ci', 'id_grado', 'id_unidad_educativa', 'id_tutor_legal'])
                            ->with(['grado:id_grado,nombre_grado', 'unidadEducativa:id_unidad_educativa,nombre,departamento,provincia', 'tutorLegal:id_tutor_legal,nombres,apellidos,ci']);
                    }])
                    ->select(['id_detalle', 'id_estudiante', 'id_lista', 'fecha_registro']) // Seleccionamos id_lista
                    ->get();

                if ($listaInscripciones->isEmpty()) {
                    continue;
                }

                foreach ($listaInscripciones as $inscripcion) {
                    // Buscar la orden de pago asociada a la lista de inscripción
                    $ordenPago = OrdenPago::where('id_lista', $inscripcion->id_lista)->first();

                    $estadoInscripcion = 'Pendiente'; // Estado por defecto

                    if ($ordenPago) {
                        $estadoInscripcion = $ordenPago->estado;
                    }
                    if(
                        $inscripcion->estudiante->unidadEducativa->departamento !== $departamento ||
                        $inscripcion->estudiante->unidadEducativa->provincia !== $provincia
                    )
                    {
                        continue;
                    }
                    $resultados[] = [
                        'estudiante' => [
                            'nombres' => $inscripcion->estudiante->nombres ?? null,
                            'apellidos' => $inscripcion->estudiante->apellidos ?? null,
                            'ci' => $inscripcion->estudiante->ci ?? null,
                            'grado' => $inscripcion->estudiante->grado->nombre_grado ?? null,
                            'unidad_educativa' => [
                                'nombre' => $inscripcion->estudiante->unidadEducativa->nombre ?? null,
                                'departamento' => $inscripcion->estudiante->unidadEducativa->departamento ?? null,
                            ],
                            'tutor_legal' => [
                                'nombre' => $inscripcion->estudiante->tutorLegal->nombres ?? null,
                                'apellido' => $inscripcion->estudiante->tutorLegal->apellidos ?? null,
                                'ci' => $inscripcion->estudiante->tutorLegal->ci ?? null,
                            ],
                        ],
                        'estado_inscripcion' => $estadoInscripcion,
                        'areas_inscritas' => $convocatoriaArea->nombre_area ?? null,
                        'fecha_inscripcion' => $inscripcion->fecha_registro ?? null, // Usamos fecha_registro de detalles_lista_inscripcion
                    ];
                }
            }
        }
        return $this->successResponse($resultados, 'Datos de la convocatoria obtenidos exitosamente.');
    }
    

   private function getDataPorArea($convocatoriaId, $area_id)
 {
        $convocatoriaAreas = ConvocatoriaArea::where('id_convocatoria', $convocatoriaId)
            ->where('convocatoria_areas.id_area', $area_id) // id area
            ->join('areas_competencia', 'convocatoria_areas.id_area', '=', 'areas_competencia.id_area')
            ->get(['convocatoria_areas.id_convocatoria_area', 'areas_competencia.nombre_area']);
        Log::info(json_encode($convocatoriaAreas));
        if ($convocatoriaAreas->isEmpty()) {
            return $this->successResponse([], 'No se encontraron áreas de convocatoria para el ID proporcionado.');
        }

        $resultados = [];
        foreach ($convocatoriaAreas as $convocatoriaArea) {
            $convocatoriaNiveles = ConvocatoriaNivel::where('id_convocatoria_area', $convocatoriaArea->id_convocatoria_area)
            ->get(['id_convocatoria_nivel']);

            if ($convocatoriaNiveles->isEmpty()) {
                continue;
            }

            foreach ($convocatoriaNiveles as $convocatoriaNivel) {
                $listaInscripciones = DetalleListaInscripcion::where('id_convocatoria_nivel', $convocatoriaNivel->id_convocatoria_nivel)
                    ->with(['estudiante' => function ($query) {
                        $query->select(['id_estudiante', 'nombres', 'apellidos', 'ci', 'id_grado', 'id_unidad_educativa', 'id_tutor_legal'])
                            ->with(['grado:id_grado,nombre_grado', 'unidadEducativa:id_unidad_educativa,nombre,departamento', 'tutorLegal:id_tutor_legal,nombres,apellidos,ci']);
                    }])
                    ->select(['id_detalle', 'id_estudiante', 'id_lista', 'fecha_registro']) // Seleccionamos id_lista
                    ->get();

                if ($listaInscripciones->isEmpty()) {
                    continue;
                }

                foreach ($listaInscripciones as $inscripcion) {
                    // Buscar la orden de pago asociada a la lista de inscripción
                    $ordenPago = OrdenPago::where('id_lista', $inscripcion->id_lista)->first();

                    $estadoInscripcion = 'Pendiente'; // Estado por defecto

                    if ($ordenPago) {
                        $estadoInscripcion = $ordenPago->estado;
                    }

                    $resultados[] = [
                        'estudiante' => [
                            'nombres' => $inscripcion->estudiante->nombres ?? null,
                            'apellidos' => $inscripcion->estudiante->apellidos ?? null,
                            'ci' => $inscripcion->estudiante->ci ?? null,
                            'grado' => $inscripcion->estudiante->grado->nombre_grado ?? null,
                            'unidad_educativa' => [
                                'nombre' => $inscripcion->estudiante->unidadEducativa->nombre ?? null,
                                'departamento' => $inscripcion->estudiante->unidadEducativa->departamento ?? null,
                            ],
                            'tutor_legal' => [
                                'nombre' => $inscripcion->estudiante->tutorLegal->nombres ?? null,
                                'apellido' => $inscripcion->estudiante->tutorLegal->apellidos ?? null,
                                'ci' => $inscripcion->estudiante->tutorLegal->ci ?? null,
                            ],
                        ],
                        'estado_inscripcion' => $estadoInscripcion,
                        'areas_inscritas' => $convocatoriaArea->nombre_area ?? null,
                        'fecha_inscripcion' => $inscripcion->fecha_registro ?? null, // Usamos fecha_registro de detalles_lista_inscripcion
                    ];
                }
            }
        }

        return $this->successResponse($resultados, 'Datos de la convocatoria obtenidos exitosamente.');
    }

    
        private function getDataPorNivel($convocatoriaId, $area_id, $nivel_id)
 {
        $convocatoriaAreas = ConvocatoriaArea::where('id_convocatoria', $convocatoriaId)
            ->where('convocatoria_areas.id_area', $area_id) // id area
            ->join('areas_competencia', 'convocatoria_areas.id_area', '=', 'areas_competencia.id_area')
            ->get(['convocatoria_areas.id_convocatoria_area', 'areas_competencia.nombre_area']);
        Log::info(json_encode($convocatoriaAreas));
        if ($convocatoriaAreas->isEmpty()) {
            return $this->successResponse([], 'No se encontraron áreas de convocatoria para el ID proporcionado.');
        }

        $resultados = [];
        foreach ($convocatoriaAreas as $convocatoriaArea) {
            $convocatoriaNiveles = ConvocatoriaNivel::where('id_convocatoria_area', $convocatoriaArea->id_convocatoria_area)
            ->where('id_nivel' , $nivel_id) // nivel id 
            ->get(['id_convocatoria_nivel']);

            if ($convocatoriaNiveles->isEmpty()) {
                continue;
            }

            foreach ($convocatoriaNiveles as $convocatoriaNivel) {
                $listaInscripciones = DetalleListaInscripcion::where('id_convocatoria_nivel', $convocatoriaNivel->id_convocatoria_nivel)
                    ->with(['estudiante' => function ($query) {
                        $query->select(['id_estudiante', 'nombres', 'apellidos', 'ci', 'id_grado', 'id_unidad_educativa', 'id_tutor_legal'])
                            ->with(['grado:id_grado,nombre_grado', 'unidadEducativa:id_unidad_educativa,nombre,departamento', 'tutorLegal:id_tutor_legal,nombres,apellidos,ci']);
                    }])
                    ->select(['id_detalle', 'id_estudiante', 'id_lista', 'fecha_registro']) // Seleccionamos id_lista
                    ->get();

                if ($listaInscripciones->isEmpty()) {
                    continue;
                }

                foreach ($listaInscripciones as $inscripcion) {
                    // Buscar la orden de pago asociada a la lista de inscripción
                    $ordenPago = OrdenPago::where('id_lista', $inscripcion->id_lista)->first();

                    $estadoInscripcion = 'Pendiente'; // Estado por defecto

                    if ($ordenPago) {
                        $estadoInscripcion = $ordenPago->estado;
                    }

                    $resultados[] = [
                        'estudiante' => [
                            'nombres' => $inscripcion->estudiante->nombres ?? null,
                            'apellidos' => $inscripcion->estudiante->apellidos ?? null,
                            'ci' => $inscripcion->estudiante->ci ?? null,
                            'grado' => $inscripcion->estudiante->grado->nombre_grado ?? null,
                            'unidad_educativa' => [
                                'nombre' => $inscripcion->estudiante->unidadEducativa->nombre ?? null,
                                'departamento' => $inscripcion->estudiante->unidadEducativa->departamento ?? null,
                            ],
                            'tutor_legal' => [
                                'nombre' => $inscripcion->estudiante->tutorLegal->nombres ?? null,
                                'apellido' => $inscripcion->estudiante->tutorLegal->apellidos ?? null,
                                'ci' => $inscripcion->estudiante->tutorLegal->ci ?? null,
                            ],
                        ],
                        'estado_inscripcion' => $estadoInscripcion,
                        'areas_inscritas' => $convocatoriaArea->nombre_area ?? null,
                        'fecha_inscripcion' => $inscripcion->fecha_registro ?? null, // Usamos fecha_registro de detalles_lista_inscripcion
                    ];
                }
            }
        }

        return $this->successResponse($resultados, 'Datos de la convocatoria obtenidos exitosamente.');
    }
         private function getDataPorUnidadEducativa($convocatoriaId, $unidadEducativa)
    {
        $convocatoriaAreas = ConvocatoriaArea::where('id_convocatoria', $convocatoriaId)
            ->join('areas_competencia', 'convocatoria_areas.id_area', '=', 'areas_competencia.id_area')
            ->get(['convocatoria_areas.id_convocatoria_area', 'areas_competencia.nombre_area']);

        if ($convocatoriaAreas->isEmpty()) {
            return $this->successResponse([], 'No se encontraron áreas de convocatoria para el ID proporcionado.');
        }

        $resultados = [];
        foreach ($convocatoriaAreas as $convocatoriaArea) {
            $convocatoriaNiveles = ConvocatoriaNivel::where('id_convocatoria_area', $convocatoriaArea->id_convocatoria_area)->get(['id_convocatoria_nivel']);

            if ($convocatoriaNiveles->isEmpty()) {
                continue;
            }

            foreach ($convocatoriaNiveles as $convocatoriaNivel) {
                $listaInscripciones = DetalleListaInscripcion::where('id_convocatoria_nivel', $convocatoriaNivel->id_convocatoria_nivel)
                    ->with(['estudiante' => function ($query) {
                        $query->select(['id_estudiante', 'nombres', 'apellidos', 'ci', 'id_grado', 'id_unidad_educativa', 'id_tutor_legal','genero'])
                            ->with(['grado:id_grado,nombre_grado', 'unidadEducativa:id_unidad_educativa,nombre,departamento', 'tutorLegal:id_tutor_legal,nombres,apellidos,ci']);
                    }])
                    ->select(['id_detalle', 'id_estudiante', 'id_lista', 'fecha_registro']) // Seleccionamos id_lista
                    ->get();

                if ($listaInscripciones->isEmpty()) {
                    continue;
                }

                foreach ($listaInscripciones as $inscripcion) {
                    // Buscar la orden de pago asociada a la lista de inscripción
                    $ordenPago = OrdenPago::where('id_lista', $inscripcion->id_lista)->first();

                    $estadoInscripcion = 'Pendiente'; // Estado por defecto

                    if ($ordenPago) {
                        $estadoInscripcion = $ordenPago->estado;
                    }
                    if( !str_contains( strtolower( $inscripcion->estudiante->unidadEducativa->nombre), $unidadEducativa)  )
                    {
                        continue; 
                    }
                    $resultados[] = [
                        'estudiante' => [
                            'nombres' => $inscripcion->estudiante->nombres ?? null,
                            'apellidos' => $inscripcion->estudiante->apellidos ?? null,
                            'ci' => $inscripcion->estudiante->ci ?? null,
                            'grado' => $inscripcion->estudiante->grado->nombre_grado ?? null,
                            'unidad_educativa' => [
                                'nombre' => $inscripcion->estudiante->unidadEducativa->nombre ?? null,
                                'departamento' => $inscripcion->estudiante->unidadEducativa->departamento ?? null,
                            ],
                            'tutor_legal' => [
                                'nombre' => $inscripcion->estudiante->tutorLegal->nombres ?? null,
                                'apellido' => $inscripcion->estudiante->tutorLegal->apellidos ?? null,
                                'ci' => $inscripcion->estudiante->tutorLegal->ci ?? null,
                            ],
                        ],
                        'estado_inscripcion' => $estadoInscripcion,
                        'areas_inscritas' => $convocatoriaArea->nombre_area ?? null,
                        'fecha_inscripcion' => $inscripcion->fecha_registro ?? null, // Usamos fecha_registro de detalles_lista_inscripcion
                    ];
                }
            }
        }
        return $this->successResponse($resultados, 'Datos de la convocatoria obtenidos exitosamente.');
    }
}