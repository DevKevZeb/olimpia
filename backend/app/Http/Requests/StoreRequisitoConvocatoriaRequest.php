<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
class StoreRequisitoConvocatoriaRequest extends FormRequest
{
    public function authorize(): bool { return true; } // Ajusta tu lógica de autorización
    public function rules(): array
    {
        return [
            '*.entidad' => 'required|string|max:255',
            '*.campo' => 'required|string|max:255',
            '*.es_obligatorio' => 'required|boolean',
        ];
    }
    public function messages(): array
    {
        return [
            '*.entidad.required' => 'La entidad del requisito es obligatoria.',
            // ...otros mensajes para los campos de los ítems del array
        ];
    }
}