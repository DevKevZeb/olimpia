<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\OrdenPago; // Importa el modelo OrdenPago

class StoreComprobanteByCodigoOrdenRequest extends FormRequest
{
    /**
     * Determina si el usuario está autorizado para hacer esta solicitud.
     */
    public function authorize(): bool
    {
        // Aquí deberías poner tu lógica de autorización.
        // Por ejemplo, verificar si el usuario autenticado tiene el permiso 'upload comprobante'.
        // Por ahora, lo dejamos en 'true' para permitir que las reglas de validación se ejecuten.
        return true;
    }

    /**
     * Obtiene las reglas de validación que se aplican a la solicitud.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // Valida que 'codigo_orden' sea requerido, una cadena y que exista en la tabla 'ordenes_pago'
            // en la columna 'codigo_unico'.
            'codigo_orden' => 'required|string|exists:ordenes_pago,codigo_unico',
            
            // Valida que 'pdf_comprobante' sea requerido, un archivo, de tipo PDF y con un tamaño máximo.
            'pdf_comprobante' => 'required|file|mimes:pdf|max:2048', // 2048 KB = 2 MB
        ];
    }

    /**
     * Personaliza los mensajes de error para las reglas de validación.
     */
    public function messages(): array
    {
        return [
            'codigo_orden.required' => 'El código de la orden es obligatorio.',
            'codigo_orden.string' => 'El código de la orden debe ser una cadena de texto.',
            'codigo_orden.exists' => 'No se encontró ninguna orden de pago con el código proporcionado.',
            
            'pdf_comprobante.required' => 'El archivo PDF del comprobante es obligatorio.',
            'pdf_comprobante.file' => 'El campo de comprobante debe ser un archivo.',
            'pdf_comprobante.mimes' => 'El comprobante debe ser un archivo PDF.',
            'pdf_comprobante.max' => 'El tamaño del archivo PDF no debe exceder los 2 MB.',
        ];
    }
}