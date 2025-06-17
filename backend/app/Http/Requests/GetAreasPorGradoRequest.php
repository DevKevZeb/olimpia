<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class GetAreasPorGradoRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array
    {
        return [
            'id_grado' => 'required|exists:grados,id_grado',
            'id_convocatoria' => 'required|exists:convocatorias,id_convocatoria'
        ];
    }
}
