<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrdenPagoRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }    public function rules()
    {
        // Updated to only support lista orders since individual inscriptions are no longer supported
        return [
            'tipo_origen' => 'required|in:lista',
            'id_lista' => 'required|exists:listas_inscripcion,id_lista',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            // Removed individual inscription validation since it's no longer supported
            if ($this->tipo_origen === 'lista' && !$this->id_lista) {
                $validator->errors()->add('id_lista', 'Se requiere una lista para órdenes de pago');
            }
            }
        });
    }
}