<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AsociarNivelesGradosRequest extends FormRequest
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
            'niveles' => 'required|array|min:1',
            'niveles.*.id_nivel' => 'required|exists:niveles_categoria,id_nivel',
            'niveles.*.id_area' => 'required|exists:areas_competencia,id_area',
            'niveles.*.id_grado_min' => 'required|exists:grados,id_grado',
            'niveles.*.id_grado_max' => 'required|exists:grados,id_grado',
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
            'niveles.required' => 'Debe proporcionar al menos un nivel.',
            'niveles.array' => 'Los niveles deben ser un arreglo.',
            'niveles.min' => 'Debe especificar al menos un nivel.',
            'niveles.*.id_nivel.required' => 'El ID del nivel es obligatorio.',
            'niveles.*.id_nivel.exists' => 'Uno de los niveles especificados no existe.',
            'niveles.*.id_area.required' => 'El ID del área es obligatorio.',
            'niveles.*.id_area.exists' => 'Una de las áreas especificadas no existe.',
            'niveles.*.id_grado_min.required' => 'El grado mínimo es obligatorio.',
            'niveles.*.id_grado_min.exists' => 'Uno de los grados mínimos especificados no existe.',
            'niveles.*.id_grado_max.required' => 'El grado máximo es obligatorio.',
            'niveles.*.id_grado_max.exists' => 'Uno de los grados máximos especificados no existe.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'id_convocatoria' => 'convocatoria',
            'niveles' => 'niveles',
            'niveles.*.id_nivel' => 'nivel',
            'niveles.*.id_area' => 'área',
            'niveles.*.id_grado_min' => 'grado mínimo',
            'niveles.*.id_grado_max' => 'grado máximo',
        ];
    }
}
