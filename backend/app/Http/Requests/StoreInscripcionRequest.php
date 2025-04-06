<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\ConvocatoriaNivel;
use App\Models\Estudiante;

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
            'id_convocatoria_nivel' => 'required|exists:convocatoria_niveles,id_convocatoria_nivel',
            'id_tutor_academico' => 'nullable|exists:tutores_academicos,id_tutor_academico',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            // Validar que el estudiante está en el rango de grados del nivel
            $estudiante = Estudiante::find($this->id_estudiante);
            $convocatoriaNivel = ConvocatoriaNivel::with(['gradoMin', 'gradoMax'])->find($this->id_convocatoria_nivel);
            
            if ($estudiante && $convocatoriaNivel) {
                if ($estudiante->id_grado < $convocatoriaNivel->id_grado_min || 
                    $estudiante->id_grado > $convocatoriaNivel->id_grado_max) {
                    $validator->errors()->add(
                        'id_convocatoria_nivel', 
                        'El estudiante no está en el rango de grados permitido para este nivel'
                    );
                }
            }
        });
    }
}