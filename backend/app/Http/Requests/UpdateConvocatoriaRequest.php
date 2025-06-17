<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateConvocatoriaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nombre' => 'sometimes|required|string|max:100',
            'fecha_inicio_inscripcion' => 'sometimes|required|date',
            'fecha_fin_inscripcion' => 'sometimes|required|date|after_or_equal:fecha_inicio_inscripcion',
            'max_areas_por_estudiante' => 'sometimes|required|integer|min:1',
            'estado' => 'sometimes|required|in:planificada,abierta,cerrada,finalizada',
        ];
    }
}