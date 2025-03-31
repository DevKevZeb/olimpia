<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInscripcionRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'id_estudiante' => 'required|exists:estudiantes,id_estudiante',
            'id_convocatoria_area' => 'required|exists:convocatoria_areas,id_convocatoria_area',
            'id_convocatoria_nivel' => 'required|exists:convocatoria_niveles,id_convocatoria_nivel',
            'id_tutor_academico' => 'nullable|exists:tutores_academicos,id_tutor_academico',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            // Validar que el nivel pertenece al área
            $convocatoriaArea = \App\Models\ConvocatoriaArea::find($this->id_convocatoria_area);
            $convocatoriaNivel = \App\Models\ConvocatoriaNivel::find($this->id_convocatoria_nivel);
            
            if ($convocatoriaArea && $convocatoriaNivel && 
                $convocatoriaArea->id_convocatoria !== $convocatoriaNivel->id_convocatoria) {
                $validator->errors()->add('id_convocatoria_nivel', 'El nivel no pertenece a la misma convocatoria que el área');
            }
            
            // Validar que el estudiante está en el rango de grados del nivel
            $estudiante = \App\Models\Estudiante::find($this->id_estudiante);
            $nivel = $convocatoriaNivel->nivel ?? null;
            
            if ($estudiante && $nivel && 
                ($estudiante->id_grado < $nivel->id_grado_min || $estudiante->id_grado > $nivel->id_grado_max)) {
                $validator->errors()->add('id_convocatoria_nivel', 'El estudiante no está en el rango de grados permitido para este nivel');
            }
        });
    }
}