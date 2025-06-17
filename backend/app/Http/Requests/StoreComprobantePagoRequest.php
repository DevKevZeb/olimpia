<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\OrdenPago; // Importar el modelo OrdenPago

class StoreComprobantePagoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Define tu lógica de autorización aquí
    }

    public function rules(): array
    {
        $rules = [
            'id_orden' => 'required|exists:ordenes_pago,id_orden',
            'numero_comprobante' => 'required|string|max:50',
            'nombre_pagador' => 'required|string|max:100',
            'fecha_pago' => 'required|date',
            'monto_pagado' => 'required|numeric|min:0',
            'pdf_comprobante' => 'required|file|mimes:pdf|max:2048',
        ];

        // Añadir validaciones de lógica de negocio si la orden existe
        if ($this->has('id_orden')) {
            $orden = OrdenPago::find($this->input('id_orden'));
            if ($orden) {
                if ($orden->estado === 'pagada') {
                    $rules['id_orden'] .= '|prohibits_if:id_orden,orden_pagada'; // Custom rule o lógica en messages
                }
                if ($orden->estado === 'vencida') {
                    $rules['id_orden'] .= '|prohibits_if:id_orden,orden_vencida'; // Custom rule
                }
                // Validación de monto, si es crítico que sea exacto al momento de la validación
                // Podría ser mejor mantenerla en el servicio si requiere más contexto
                $montoPagado = (float) $this->input('monto_pagado');
                $montoTotalOrden = (float) $orden->monto_total;
                if ($montoPagado < $montoTotalOrden) {
                    $rules['monto_pagado'] .= '|min_value:' . $montoTotalOrden; // Esto requiere una regla personalizada o hacerlo en el servicio
                }
            }
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'id_orden.prohibits_if' => 'Esta orden de pago ya ha sido pagada o está vencida.', // Mensaje genérico
            'monto_pagado.min_value' => 'El monto pagado debe ser igual o mayor al monto total de la orden.',
            // ...otros mensajes de validación
        ];
    }

    /**
     * Prepara los datos para la validación (opcional).
     */
    protected function prepareForValidation()
    {
        // Puedes agregar un input para el error de monto si lo manejas aquí
        if ($this->has('id_orden') && $this->has('monto_pagado')) {
            $orden = OrdenPago::find($this->input('id_orden'));
            if ($orden && (float) $this->input('monto_pagado') < (float) $orden->monto_total) {
                // Puedes añadir un error manualmente o usar una regla personalizada.
                // Para el ejemplo, la regla min_value ya lo cubre.
            }
        }
    }
}