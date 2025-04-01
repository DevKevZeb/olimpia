<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ComprobantePago extends Model
{
    use HasFactory;

    protected $table = 'comprobantes_pago';
    protected $primaryKey = 'id_comprobante';
    
    protected $fillable = [
        'id_orden',
        'numero_comprobante',
        'nombre_pagador',
        'fecha_pago',
        'monto_pagado',
        'pdf_comprobante',
        'datos_ocr',
        'estado_verificacion',
    ];

    protected $casts = [
        'fecha_pago' => 'datetime',
        'monto_pagado' => 'decimal:2',
        'datos_ocr' => 'json',
    ];

    public function orden()
    {
        return $this->belongsTo(OrdenPago::class, 'id_orden');
    }
}