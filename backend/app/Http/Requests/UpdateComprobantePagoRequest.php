<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
class UpdateComprobantePagoRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array {
        return [
            'numero_comprobante' => 'sometimes|required|string|max:50',
            'nombre_pagador' => 'sometimes|required|string|max:100',
            'fecha_pago' => 'sometimes|required|date',
            'monto_pagado' => 'sometimes|required|numeric|min:0',
            'estado_verificacion' => 'sometimes|required|in:pendiente,verificado,rechazado',
            'pdf_comprobante' => 'sometimes|file|mimes:pdf|max:2048',
        ];
    }
}