<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SearchUserByCiRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Aquí puedes poner tu lógica de autorización, por ejemplo, si el usuario
        // autenticado tiene permiso para realizar búsquedas.
        return true; // Ajusta según tus necesidades de seguridad
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'ci' => 'required|string|min:4|max:20', // Ajusta las reglas para CI según tus necesidades
            'type' => 'required|string|in:estudiantes,tutores_legales', // Valida que el tipo sea uno de los permitidos
        ];
    }

    /**
     * Get the error messages for the defined validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'ci.required' => 'El CI es obligatorio para la búsqueda.',
            'ci.string' => 'El CI debe ser una cadena de texto.',
            'type.required' => 'El tipo de usuario es obligatorio.',
            'type.string' => 'El tipo de usuario debe ser una cadena de texto.',
            'type.in' => 'El tipo de usuario no es válido. Solo se permiten "estudiantes" o "tutores_legales".',
        ];
    }
}