<?php
namespace App\Services;
use App\Models\Convocatoria;
use App\Models\ConvocatoriaArea;
use App\Models\ConvocatoriaNivel;
use App\Models\DetalleListaInscripcion;
use App\Models\Estudiante;
use App\Models\AreaCompetencia; // Asegúrate de importar AreaCompetencia

class InscripcionCheckerService
{
    public function checkStudentsForInscripcion(array $inscripciones, Convocatoria $convocatoria): array
    {
        $erroresInscripcion = [];
        $idConvocatoria = $convocatoria->id_convocatoria;
        $maxAreasPermitidas = $convocatoria->max_areas_por_estudiante;

        foreach ($inscripciones as $inscripcionData) {
            $ciEstudiante = $inscripcionData['ci'];
            $idGradoNuevo = $inscripcionData['id_grado'];
            $areasSeleccionadas = $inscripcionData['areas_seleccionadas'];
            $numAreasNuevas = count($areasSeleccionadas);

            $estudianteExistente = Estudiante::where('ci', $ciEstudiante)->first();

            $numInscripcionesPrevias = 0;
            if ($estudianteExistente) {
                // Obtener IDs de niveles de convocatoria habilitados para esta convocatoria
                $nivelesHabilitados = ConvocatoriaNivel::whereHas('convocatoriaArea', function($q) use ($idConvocatoria) {
                    $q->where('id_convocatoria', $idConvocatoria);
                })->pluck('id_convocatoria_nivel');

                $numInscripcionesPrevias = DetalleListaInscripcion::where('id_estudiante', $estudianteExistente->id_estudiante)
                    ->whereIn('id_convocatoria_nivel', $nivelesHabilitados)
                    ->count();

                if ($estudianteExistente->id_grado !== $idGradoNuevo) {
                    $erroresInscripcion[$ciEstudiante] = "No puede registrar al estudiante con CI {$ciEstudiante} con un distinto Grado en la misma convocatoria.";
                    continue;
                }
            }

            if (($numAreasNuevas + $numInscripcionesPrevias) > $maxAreasPermitidas) {
                $erroresInscripcion[$ciEstudiante] = "El estudiante con CI {$ciEstudiante} ya tiene {$numInscripcionesPrevias} inscripción(es) previa(s) y está intentando registrar {$numAreasNuevas} más, excediendo el máximo de {$maxAreasPermitidas} área(s) permitida(s).";
                continue;
            }

            foreach ($areasSeleccionadas as $areaSeleccionada) {
                $idConvocatoriaNivel = $areaSeleccionada['id_convocatoria_nivel'];

                if ($this->isStudentAlreadyEnrolledInArea($ciEstudiante, $idConvocatoriaNivel)) {
                    $nombreArea = $this->getAreaName($idConvocatoriaNivel);
                    $erroresInscripcion[$ciEstudiante] = "El estudiante con CI {$ciEstudiante} ya está inscrito en el área '{$nombreArea}'.";
                    break; // Salir del bucle de áreas para este estudiante
                }
            }
        }
        return $erroresInscripcion;
    }

    private function isStudentAlreadyEnrolledInArea(string $ciEstudiante, int $idConvocatoriaNivel): bool
    {
        return DetalleListaInscripcion::whereHas('estudiante', function ($query) use ($ciEstudiante) {
            $query->where('ci', $ciEstudiante);
        })
        ->where('id_convocatoria_nivel', $idConvocatoriaNivel)
        ->exists();
    }

    private function getAreaName(int $idConvocatoriaNivel): string
    {
        $convocatoriaNivel = ConvocatoriaNivel::with('convocatoriaArea.area')
            ->find($idConvocatoriaNivel);

        if ($convocatoriaNivel && $convocatoriaNivel->convocatoriaArea && $convocatoriaNivel->convocatoriaArea->area) {
            return $convocatoriaNivel->convocatoriaArea->area->nombre_area;
        }

        return 'Área Desconocida';
    }
}
