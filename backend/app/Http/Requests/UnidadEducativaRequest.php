<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UnidadEducativaRequest extends FormRequest
{

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nombre' => 'required|string|max:200',
            'departamento' => 'required|string|max:100',
            'provincia' => 'required|string|max:100',
        ];
    }
    
    public function messages(): array
    {
        return [
            'nombre' => 'El campo nombre es requerido',
            'departamento' => 'El campo departamento es requerido',
            'provincia' => 'El campo provincia es requerido',
        ];
    }
}
