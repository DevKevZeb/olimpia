<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
class StoreEstudianteRequest extends FormRequest
{
    public function authorize(): bool { return true; } // Ajusta tu lógica de autorización
    public function rules(): array
    {
        return [
            'nombres' => 'required|string|max:100',
            'apellidos' => 'required|string|max:100',
            'ci' => 'required|string|max:20|unique:estudiantes,ci', // 'unique:tabla,columna'
            'fecha_nacimiento' => 'required|date',
            'email' => 'nullable|email|max:100',
            'id_unidad_educativa' => 'required|exists:unidades_educativas,id_unidad_educativa',
            'id_grado' => 'required|exists:grados,id_grado',
            'id_tutor_legal' => 'required|exists:tutores_legales,id_tutor_legal',
        ];
    }
    public function messages(): array
    {
        return [
            'ci.unique' => 'Ya existe un estudiante con este CI.',
            'id_unidad_educativa.exists' => 'La unidad educativa seleccionada no existe.',
            // ...otros mensajes personalizados
        ];
    }
}