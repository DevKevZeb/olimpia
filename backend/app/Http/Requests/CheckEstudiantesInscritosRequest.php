<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class CheckEstudiantesInscritosRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array
    {
        return [
            'lista_inscripcion' => 'required|array',
            'lista_inscripcion.*.nombres' => 'required|string|max:100',
            'lista_inscripcion.*.apellidos' => 'required|string|max:100',
            'lista_inscripcion.*.ci' => 'required|string|max:20',
            'lista_inscripcion.*.id_grado' => 'required|exists:grados,id_grado',
            'lista_inscripcion.*.areas_seleccionadas' => 'required|array|min:1',
            'lista_inscripcion.*.areas_seleccionadas.*.id_convocatoria_nivel' => 'required|exists:convocatoria_niveles,id_convocatoria_nivel',
            'id_convocatoria' => 'required|exists:convocatorias,id_convocatoria',
        ];
    }
}