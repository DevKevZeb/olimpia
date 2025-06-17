<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
class UpdateEstudianteRequest extends FormRequest
{
    public function authorize(): bool { return true; } // Ajusta tu lógica de autorización
    public function rules(): array
    {
        // Obtén el ID del estudiante desde la ruta
        $estudianteId = $this->route('estudiante'); // Asume que el parámetro de ruta se llama 'estudiante'

        return [
            'nombres' => 'sometimes|required|string|max:100',
            'apellidos' => 'sometimes|required|string|max:100',
            'ci' => 'sometimes|required|string|max:20|unique:estudiantes,ci,' . $estudianteId . ',id_estudiante', // Excluye el ID actual
            'fecha_nacimiento' => 'sometimes|required|date',
            'email' => 'nullable|email|max:100',
            'id_unidad_educativa' => 'sometimes|required|exists:unidades_educativas,id_unidad_educativa',
            'id_grado' => 'sometimes|required|exists:grados,id_grado',
            'id_tutor_legal' => 'sometimes|required|exists:tutores_legales,id_tutor_legal',
        ];
    }
    public function messages(): array
    {
        return [
            'ci.unique' => 'Ya existe otro estudiante con este CI.',
            // ...otros mensajes personalizados
        ];
    }
}