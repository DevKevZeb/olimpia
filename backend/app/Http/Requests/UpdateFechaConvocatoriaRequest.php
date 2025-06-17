<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Convocatoria; // Asegúrate de importar el modelo

class UpdateFechaConvocatoriaRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Aquí puedes poner tu lógica de autorización, por ejemplo:
        // return $this->user()->can('update-convocatoria-date');
        return true; // Por ahora, ajusta esto según tus necesidades de seguridad
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        // Obtén la instancia de la convocatoria del Route Model Binding
        // Esto asume que el parámetro de la ruta se llama 'convocatoria'
        $convocatoria = $this->route('convocatoria'); // Si el parámetro en tu ruta es 'id', cámbialo a 'id'

        // Si la convocatoria no se encontró (aunque con Route Model Binding esto ya sería un 404),
        // o si es una nueva convocatoria (en un store, no en un update), maneja el caso.
        // Para un update, $convocatoria siempre debería existir aquí.
        $fechaActual = $convocatoria ? $convocatoria->fecha_fin_inscripcion : now()->subDay()->toDateString();

        return [
            'nueva_fecha' => [
                'required',
                'date',
                // Asegura que la nueva fecha sea estrictamente posterior a la fecha actual de fin de inscripción
                'after:' . $fechaActual,
            ],
        ];
    }

    /**
     * Get the error messages for the defined validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'nueva_fecha.required' => 'La nueva fecha es obligatoria.',
            'nueva_fecha.date' => 'La nueva fecha debe ser una fecha válida.',
            'nueva_fecha.after' => 'La nueva fecha debe ser posterior a la fecha de fin de inscripción actual.',
        ];
    }
}