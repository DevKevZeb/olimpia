<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreConvocatoriaNivelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_convocatoria_area' => 'required|exists:convocatoria_areas,id_convocatoria_area',
            'id_nivel' => 'required|exists:niveles_categoria,id_nivel',
            'id_grado_min' => 'required|exists:grados,id_grado',
            'id_grado_max' => 'required|exists:grados,id_grado',
        ];
    }

    public function messages(): array
    {
        return [
            'id_convocatoria_area.required' => 'Debe especificar el área de la convocatoria.',
            'id_nivel.required' => 'Debe especificar el nivel.',
            'id_grado_min.required' => 'Debe especificar el grado mínimo.',
            'id_grado_max.required' => 'Debe especificar el grado máximo.',
        ];
    }
}
