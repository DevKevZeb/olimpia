<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrdenPagoRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'tipo_origen' => 'required|in:individual,lista',
            'id_inscripcion' => 'required_if:tipo_origen,individual|nullable|exists:inscripciones,id_inscripcion',
            'id_lista' => 'required_if:tipo_origen,lista|nullable|exists:listas_inscripcion,id_lista',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if ($this->tipo_origen === 'individual' && !$this->id_inscripcion) {
                $validator->errors()->add('id_inscripcion', 'Se requiere una inscripción para órdenes individuales');
            }
            
            if ($this->tipo_origen === 'lista' && !$this->id_lista) {
                $validator->errors()->add('id_lista', 'Se requiere una lista para órdenes grupales');
            }
        });
    }
}