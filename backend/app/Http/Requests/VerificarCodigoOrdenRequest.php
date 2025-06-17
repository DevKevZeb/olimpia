<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
class VerificarCodigoOrdenRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array { return ['codigo_orden' => 'required|string|exists:ordenes_pago,codigo_unico']; }
    public function messages(): array { return ['codigo_orden.exists' => 'No se encontró una orden de pago con ese código.']; }
}