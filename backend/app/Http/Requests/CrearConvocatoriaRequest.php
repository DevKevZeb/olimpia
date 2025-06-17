<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CrearConvocatoriaRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Ajustar según lógica de autorización
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'nombre' => 'required|string|max:100',
            'fecha_inicio_inscripcion' => 'required|date',
            'fecha_fin_inscripcion' => 'required|date|after_or_equal:fecha_inicio_inscripcion',
            'max_areas_por_estudiante' => 'required|integer|min:1',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'nombre.required' => 'El nombre de la convocatoria es obligatorio.',
            'nombre.max' => 'El nombre no puede exceder 100 caracteres.',
            'fecha_inicio_inscripcion.required' => 'La fecha de inicio de inscripción es obligatoria.',
            'fecha_inicio_inscripcion.date' => 'La fecha de inicio debe ser una fecha válida.',
            'fecha_fin_inscripcion.required' => 'La fecha de fin de inscripción es obligatoria.',
            'fecha_fin_inscripcion.date' => 'La fecha de fin debe ser una fecha válida.',
            'fecha_fin_inscripcion.after_or_equal' => 'La fecha de fin debe ser igual o posterior a la fecha de inicio.',
            'max_areas_por_estudiante.required' => 'El máximo de áreas por estudiante es obligatorio.',
            'max_areas_por_estudiante.integer' => 'El máximo de áreas debe ser un número entero.',
            'max_areas_por_estudiante.min' => 'El máximo de áreas debe ser al menos 1.',
        ];
    }
}
