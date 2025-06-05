<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Convocatoria;
use App\Models\ConvocatoriaArea;
use App\Models\Grado;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Cell\DataValidation;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExcelController extends Controller
{
    public function downloadTemplate($id_convocatoria)
    {
        $convocatoria = Convocatoria::findOrFail($id_convocatoria);
        $areas = $this->getAreasConvocatoria($id_convocatoria);
        $grados = $this->getGrados();
        $departamentos = $this->getDepartamentosBolivia();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $columnIndex = 'A';
        $rowIndex = 1; // Fila del encabezado

        // Columnas base para la Inscripción
        $areaCompetenciaColumn = $columnIndex;
        $sheet->setCellValue($columnIndex++ . $rowIndex, 'ÁREA DE COMPETENCIA');
        $nivelCompetenciaColumn = $columnIndex;
        $sheet->setCellValue($columnIndex++ . $rowIndex, 'NIVEL DE COMPETENCIA');
        $columnIndex++; // Espacio

        // Columnas para el Estudiante
        $sheet->setCellValue($columnIndex++ . $rowIndex, 'Nombres del Estudiante');
        $sheet->setCellValue($columnIndex++ . $rowIndex, 'Apellidos del Estudiante');
        $sheet->setCellValue($columnIndex++ . $rowIndex, 'CI del Estudiante');
        $generoColumn = $columnIndex;
        $sheet->setCellValue($columnIndex++ . $rowIndex, 'Genero');
        $sheet->setCellValue($columnIndex++ . $rowIndex, 'Fecha de Nacimiento (YYYY-MM-DD)');
        $sheet->setCellValue($columnIndex++ . $rowIndex, 'Email del Estudiante');
        $sheet->setCellValue($columnIndex++ . $rowIndex, 'Telefono del Estudiante');
        $unidadEducativaColumn = $columnIndex;
        $sheet->setCellValue($columnIndex++ . $rowIndex, 'Unidad Educativa');
        $departamentoColumn = $columnIndex;
        $sheet->setCellValue($columnIndex++ . $rowIndex, 'Departamento');
        $provinciaColumn = $columnIndex;
        $sheet->setCellValue($columnIndex++ . $rowIndex, 'Provincia');
        $gradoColumn = $columnIndex;
        $sheet->setCellValue($columnIndex++ . $rowIndex, 'Grado');
        $columnIndex++; // Espacio

        // Sección para el Tutor Legal
        $sheet->setCellValue($columnIndex++ . $rowIndex, 'Nombres del Tutor Legal');
        $sheet->setCellValue($columnIndex++ . $rowIndex, 'Apellidos del Tutor Legal');
        $sheet->setCellValue($columnIndex++ . $rowIndex, 'CI del Tutor Legal');
        $sheet->setCellValue($columnIndex++ . $rowIndex, 'Teléfono del Tutor Legal');
        $sheet->setCellValue($columnIndex++ . $rowIndex, 'Email del Tutor Legal');
        $sheet->setCellValue($columnIndex++ . $rowIndex, 'Parentesco del Tutor Legal');
        $columnIndex++; // Espacio

        // Sección para el Tutor Académico
        $sheet->setCellValue($columnIndex++ . $rowIndex, 'Nombres del Tutor Académico');
        $sheet->setCellValue($columnIndex++ . $rowIndex, 'Apellidos del Tutor Académico');
        $sheet->setCellValue($columnIndex++ . $rowIndex, 'CI del Tutor Académico');
        $sheet->setCellValue($columnIndex++ . $rowIndex, 'Teléfono del Tutor Académico');
        $sheet->setCellValue($columnIndex++ . $rowIndex, 'Email del Tutor Académico');

        // Validación de datos para Género (ya existente)
        $this->setDataValidationList($sheet, $generoColumn, '"Masculino,Femenino"');

        // Validación de datos para Área de Competencia
        $this->setDataValidationList($sheet, $areaCompetenciaColumn, '"' . implode(',', $areas) . '"');

        // Validación de datos para Grado
        $this->setDataValidationList($sheet, $gradoColumn, '"' . implode(',', $grados) . '"');

        // Validación de datos para Departamento
        $this->setDataValidationList($sheet, $departamentoColumn, '"' . implode(',', $departamentos) . '"');

        // Nota: La validación para Nivel de Competencia y Provincia dependerá de tu lógica y datos.

        $writer = new Xlsx($spreadsheet);
        $filename = 'plantilla_inscripcion_' . $id_convocatoria . '_' . str_replace(' ', '_', $convocatoria->nombre) . '.xlsx';

        return new StreamedResponse(
            function () use ($writer) {
                $writer->save('php://output');
            },
            200,
            [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition' => 'attachment;filename="' . urlencode($filename) . '"',
                'Cache-Control' => 'max-age=0',
            ]
        );
    }

    private function getAreasConvocatoria(int $id_convocatoria): array
    {
        return ConvocatoriaArea::where('id_convocatoria', $id_convocatoria)
            ->with('area') // Carga la relación 'area'
            ->get()
            ->pluck('area.nombre_area') // Obtiene el 'nombre_area' del modelo AreaCompetencia
            ->toArray();
    }

    private function getGrados(): array
    {
        return Grado::orderBy('orden')
            ->pluck('nombre_grado')
            ->toArray();
    }

    private function getDepartamentosBolivia(): array
    {
        return [
            'Chuquisaca',
            'La Paz',
            'Cochabamba',
            'Oruro',
            'Potosí',
            'Tarija',
            'Santa Cruz',
            'Beni',
            'Pando',
        ];
    }

    private function setDataValidationList($sheet, $column, $formula)
    {
        $validation = new DataValidation();
        $validation->setType(DataValidation::TYPE_LIST);
        $validation->setErrorStyle(DataValidation::STYLE_INFORMATION);
        $validation->setAllowBlank(false);
        $validation->setShowInputMessage(true);
        $validation->setShowErrorMessage(true);
        $validation->setErrorTitle('Error de Selección');
        $validation->setError('Por favor, selecciona un valor de la lista.');
        $validation->setPromptTitle('Seleccionar Valor');
        $validation->setPrompt('Selecciona un valor de la lista desplegable.');
        $validation->setFormula1($formula);

        $firstRow = 2;
        $lastRow = 500;
        for ($row = $firstRow; $row <= $lastRow; $row++) {
            $sheet->getCell($column . $row)->setDataValidation($validation);
        }
    }
}