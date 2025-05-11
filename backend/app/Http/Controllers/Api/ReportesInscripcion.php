<?php

namespace App\Http\Controllers\Api;

use App\Models\ConvocatoriaArea;
use App\Models\ConvocatoriaNivel;
use App\Models\DetalleListaInscripcion;
use App\Models\Estudiante;
use App\Models\TutorAcademico;
use App\Models\UnidadEducativa;
use App\Models\OrdenPago; // Importa el modelo OrdenPago
use Illuminate\Http\Request;

class ReportesInscripcion extends ApiController
{
    public function GetReporte(Request $request)
    {
        $campo = $request->route('campo');
        $id = $request->route('id');

        if ($campo == 'convocatoria') {
            return $this->getConvocatoriaData($id);
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

                    $estadoInscripcion = 'Pendiente de Pago'; // Estado por defecto

                    if ($ordenPago) {
                        // Aquí puedes definir los estados que consideras como "inscrito"
                        if ($ordenPago->estado === 'Pagado' || $ordenPago->estado === 'Activo') {
                            $estadoInscripcion = 'Inscrito';
                        } else if ($ordenPago->estado === 'Vencido') {
                            $estadoInscripcion = 'Pago Vencido';
                        }
                        // Puedes agregar más condiciones según los posibles estados de tu orden de pago
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