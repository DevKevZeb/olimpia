<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class StoreInscripcionCompletaRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array
    {
        return [
            'lista_inscripcion' => 'required|array',
            'lista_inscripcion.*.nombres' => 'required|string|max:100',
            'lista_inscripcion.*.apellidos' => 'required|string|max:100',
            'lista_inscripcion.*.ci' => 'required|string|max:20',
            'lista_inscripcion.*.genero' => 'nullable|string|max:20',
            'lista_inscripcion.*.fecha_nacimiento' => 'required|date',
            'lista_inscripcion.*.email' => 'nullable|email|max:100',
            'lista_inscripcion.*.id_grado' => 'required|exists:grados,id_grado',
            'lista_inscripcion.*.telefono' => 'nullable|string|max:20',
            'lista_inscripcion.*.departamento' => 'nullable|string|max:50', // Agregado
            'lista_inscripcion.*.provincia' => 'nullable|string|max:50', // Agregado

            'lista_inscripcion.*.unidad_educativa' => 'required|array',
            'lista_inscripcion.*.unidad_educativa.id_unidad_educativa' => 'nullable|exists:unidades_educativas,id_unidad_educativa',
            'lista_inscripcion.*.unidad_educativa.nombre' => 'nullable|required_without:lista_inscripcion.*.unidad_educativa.id_unidad_educativa|string|max:200',
            'lista_inscripcion.*.unidad_educativa.departamento' => 'nullable|string|max:50',
            'lista_inscripcion.*.unidad_educativa.provincia' => 'nullable|string|max:50',

            'lista_inscripcion.*.tutor_legal' => 'required|array',
            'lista_inscripcion.*.tutor_legal.nombres' => 'required|string|max:100',
            'lista_inscripcion.*.tutor_legal.apellidos' => 'required|string|max:100',
            'lista_inscripcion.*.tutor_legal.ci' => 'required|string|max:20',
            'lista_inscripcion.*.tutor_legal.telefono' => 'nullable|string|max:20',
            'lista_inscripcion.*.tutor_legal.email' => 'nullable|email|max:100',
            'lista_inscripcion.*.tutor_legal.parentesco' => 'nullable|string|max:50',
            'lista_inscripcion.*.tutor_legal.es_el_mismo_estudiante' => 'required|boolean',

            'lista_inscripcion.*.areas_seleccionadas' => 'required|array|min:1',
            'lista_inscripcion.*.areas_seleccionadas.*.id_convocatoria_nivel' => 'required|exists:convocatoria_niveles,id_convocatoria_nivel',

            'lista_inscripcion.*.tutores_academicos' => 'nullable|array',
            'lista_inscripcion.*.tutores_academicos.*.id_convocatoria_nivel' => 'nullable|exists:convocatoria_niveles,id_convocatoria_nivel',
            'lista_inscripcion.*.tutores_academicos.*.nombres' => 'nullable|string|max:100',
            'lista_inscripcion.*.tutores_academicos.*.apellidos' => 'nullable|string|max:100',
            'lista_inscripcion.*.tutores_academicos.*.ci' => 'nullable|string|max:20',
            'lista_inscripcion.*.tutores_academicos.*.telefono' => 'nullable|string|max:20',
            'lista_inscripcion.*.tutores_academicos.*.email' => 'nullable|email|max:100',

            'id_convocatoria' => 'required|exists:convocatorias,id_convocatoria',
            'codigo_unico' => 'required|string|unique:ordenes_pago,codigo_unico', // Asumiendo que el código único es para la orden de pago
            'encargado_pago' => 'required|array',
            'encargado_pago.nombres_encargado' => 'required|string|max:100',
            'encargado_pago.apellidos_encargado' => 'required|string|max:100',
            'encargado_pago.ci_encargado' => 'required|string|max:20',
            'encargado_pago.email_encargado' => 'required|email|max:100',
        ];
    }

    public function messages(): array
    {
        return [
            'codigo_unico.unique' => 'El código único de pago ya ha sido registrado.',
            // ... otros mensajes personalizados
        ];
    }
}