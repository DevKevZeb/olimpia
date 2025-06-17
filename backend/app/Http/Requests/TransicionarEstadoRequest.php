<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TransicionarEstadoRequest extends FormRequest
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
            'nuevo_estado' => 'required|in:planificada,abierta,cerrada,finalizada'
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'nuevo_estado.required' => 'El nuevo estado es obligatorio.',
            'nuevo_estado.in' => 'El estado especificado no es válido. Debe ser: planificada, abierta, cerrada o finalizada.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'nuevo_estado' => 'estado',
        ];
    }
}
