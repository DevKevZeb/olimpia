<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreConvocatoriaRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Aquí puedes añadir lógica de autorización (e.g., Gate o Policy)
        return true; // Por ahora, permitimos que cualquier usuario autorizado acceda
    }

    public function rules(): array
    {
        return [
            'nombre' => 'required|string|max:100',
            'fecha_inicio_inscripcion' => 'required|date',
            'fecha_fin_inscripcion' => 'required|date|after_or_equal:fecha_inicio_inscripcion',
            'max_areas_por_estudiante' => 'required|integer|min:1',
            'estado' => 'required|in:planificada,abierta,cerrada,finalizada',
        ];
    }

    public function messages(): array
    {
        return [
            'nombre.required' => 'El nombre de la convocatoria es obligatorio.',
            'fecha_inicio_inscripcion.required' => 'La fecha de inicio de inscripción es obligatoria.',
            'fecha_fin_inscripcion.required' => 'La fecha de fin de inscripción es obligatoria.',
            'fecha_fin_inscripcion.after_or_equal' => 'La fecha de fin de inscripción debe ser igual o posterior a la fecha de inicio.',
            'max_areas_por_estudiante.required' => 'El número máximo de áreas por estudiante es obligatorio.',
            'max_areas_por_estudiante.min' => 'El número máximo de áreas por estudiante debe ser al menos 1.',
            'estado.required' => 'El estado de la convocatoria es obligatorio.',
            'estado.in' => 'El estado de la convocatoria no es válido.',
        ];
    }
}
