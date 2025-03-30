<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pago extends Model
{
    protected $table = 'Pago';
    protected $primaryKey = 'Id_pago';
    public $timestamps = false;
    
    protected $fillable = [
        'Id_inscripcion', 'monto', 'fecha_pago', 'numero_comprobante',
        'nombre_pagador', 'archivo_comprobante'
    ];
    
    public function inscripcion()
    {
        return $this->belongsTo(Inscripcion::class, 'Id_inscripcion');
    }
}
