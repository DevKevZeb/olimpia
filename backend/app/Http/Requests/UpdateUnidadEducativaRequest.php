<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUnidadEducativaRequest extends FormRequest
{

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nombre' => 'sometimes|required|string|max:200',
            'departamento' => 'sometimes|required|string|max:100',
            'provincia' => 'sometimes|required|string|max:100',
        ];
    }
    
    public function messages(): array
    {
        return [
            'nombre' => 'El campo nombre debe ser un string',
            'departamento' => 'El campo departamento debe ser un string',
            'provincia' => 'El campo provincia debe ser un string',
        ];
    }
}
