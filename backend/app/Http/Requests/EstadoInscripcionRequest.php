<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EstadoInscripcionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Cambia a lógica personalizada si necesitas control de acceso
    }

    public function rules(): array
    {
        return [
            'ci' => 'required|digits_between:5,15' // Ajusta longitud según tu contexto
        ];
    }

    public function messages(): array
    {
        return [
            'ci.required' => 'Debe proporcionar un número de CI.',
            'ci.digits_between' => 'El CI debe contener solo números y tener una longitud válida.',
        ];
    }

    public function validationData()
    {
        // Hace que los parámetros de ruta (como {ci}) sean accesibles para la validación
        return array_merge($this->all(), $this->route()->parameters());
    }
}
