<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Convocatoria;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class ExcelController extends Controller
{
    public function downloadTemplate($id_convocatoria)
    {
        $convocatoria = Convocatoria::findOrFail($id_convocatoria);

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $columnIndex = 'A';

        // Columnas base para la Inscripción
        $sheet->setCellValue($columnIndex++ . '1', 'ÁREA DE COMPETENCIA');
        $sheet->setCellValue($columnIndex++ . '1', 'NIVEL DE COMPETENCIA');
        $columnIndex++; // Espacio

        // Columnas para el Estudiante
        $sheet->setCellValue($columnIndex++ . '1', 'Nombres del Estudiante');
        $sheet->setCellValue($columnIndex++ . '1', 'Apellidos del Estudiante');
        $sheet->setCellValue($columnIndex++ . '1', 'CI del Estudiante');
        $sheet->setCellValue($columnIndex++ . '1', 'Genero');     
        $sheet->setCellValue($columnIndex++ . '1', 'Fecha de Nacimiento (YYYY-MM-DD)');
        $sheet->setCellValue($columnIndex++ . '1', 'Email del Estudiante');
        $sheet->setCellValue($columnIndex++ . '1', 'Unidad Educativa');
        $sheet->setCellValue($columnIndex++ . '1', 'Departamento');
        $sheet->setCellValue($columnIndex++ . '1', 'Provincia');
        $sheet->setCellValue($columnIndex++ . '1', 'Grado');
        $columnIndex++; // Espacio

        // Sección para el Tutor Legal
        $sheet->setCellValue($columnIndex++ . '1', 'Nombres del Tutor Legal');
        $sheet->setCellValue($columnIndex++ . '1', 'Apellidos del Tutor Legal');
        $sheet->setCellValue($columnIndex++ . '1', 'CI del Tutor Legal');
        $sheet->setCellValue($columnIndex++ . '1', 'Teléfono del Tutor Legal');
        $sheet->setCellValue($columnIndex++ . '1', 'Email del Tutor Legal');
        $sheet->setCellValue($columnIndex++ . '1', 'Parentesco del Tutor Legal');
        $columnIndex++; // Espacio

        // Sección para el Tutor Académico
        $sheet->setCellValue($columnIndex++ . '1', 'Nombres del Tutor Académico');
        $sheet->setCellValue($columnIndex++ . '1', 'Apellidos del Tutor Académico');
        $sheet->setCellValue($columnIndex++ . '1', 'CI del Tutor Académico');
        $sheet->setCellValue($columnIndex++ . '1', 'Teléfono del Tutor Académico');
        $sheet->setCellValue($columnIndex++ . '1', 'Email del Tutor Académico');

        $writer = new Xlsx($spreadsheet);
        $filename = 'plantilla_inscripcion_' . $id_convocatoria . '_' . str_replace(' ', '_', $convocatoria->nombre) . '.xlsx';

        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment;filename="' . urlencode($filename) . '"');
        header('Cache-Control: max-age=0');

        $writer->save('php://output');
        exit();
    }
}