<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
class UpdateRequisitoConvocatoriaRequest extends FormRequest
{
    public function authorize(): bool { return true; } // Ajusta tu lógica de autorización
    public function rules(): array
    {
        return [
            // 'id_convocatoria' => 'sometimes|required|exists:convocatorias,id_convocatoria', // Si no se debe cambiar, quítalo o hazlo inmutable
            'entidad' => 'sometimes|required|string|max:255',
            'campo' => 'sometimes|required|string|max:255',
            'es_obligatorio' => 'sometimes|required|boolean',
        ];
    }
}