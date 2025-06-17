<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AsociarAreasRequest extends FormRequest
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
            'id_convocatoria' => 'required|exists:convocatorias,id_convocatoria',
            'areas' => 'required|array|min:1',
            'areas.*.id_area' => 'required|exists:areas_competencia,id_area',
            'areas.*.costo_inscripcion' => 'nullable|numeric|min:0',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'id_convocatoria.required' => 'El ID de la convocatoria es obligatorio.',
            'id_convocatoria.exists' => 'La convocatoria especificada no existe.',
            'areas.required' => 'Debe proporcionar al menos un área.',
            'areas.array' => 'Las áreas deben ser un arreglo.',
            'areas.min' => 'Debe especificar al menos un área.',
            'areas.*.id_area.required' => 'El ID del área es obligatorio.',
            'areas.*.id_area.exists' => 'Una de las áreas especificadas no existe.',
            'areas.*.costo_inscripcion.numeric' => 'El costo de inscripción debe ser un número.',
            'areas.*.costo_inscripcion.min' => 'El costo de inscripción no puede ser negativo.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'id_convocatoria' => 'convocatoria',
            'areas' => 'áreas',
            'areas.*.id_area' => 'área',
            'areas.*.costo_inscripcion' => 'costo de inscripción',
        ];
    }
}
