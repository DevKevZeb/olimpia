<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DocumentoDeAreaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; 
    }

    public function rules(): array
    {
        return [
            'id_area' => 'required|integer|exists:areas_competencia,id_area',
        ];
    }

    public function messages(): array
    {
        return [
            'id_area.required' => 'Debe proporcionar un ID de área.',
            'id_area.integer' => 'El ID del área debe ser un número entero.',
            'id_area.exists' => 'El área especificada no existe.',
        ];
    }
}
