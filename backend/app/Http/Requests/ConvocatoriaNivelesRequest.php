<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ConvocatoriaNivelesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // O ajusta según políticas de acceso
    }

    public function rules(): array
    {
        return [
            'id_convocatoria' => 'required|integer|exists:convocatorias,id_convocatoria',
        ];
    }

    public function messages(): array
    {
        return [
            'id_convocatoria.required' => 'Debe proporcionar el ID de la convocatoria.',
            'id_convocatoria.integer' => 'El ID de la convocatoria debe ser un número entero.',
            'id_convocatoria.exists' => 'La convocatoria especificada no existe.',
        ];
    }

    public function validationData()
    {
        // Permite validar parámetros de ruta como {id_convocatoria}
        return array_merge($this->all(), $this->route()->parameters());
    }
}
