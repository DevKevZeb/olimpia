<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrdenPago extends Model
{
    use HasFactory;

    protected $table = 'ordenes_pago';
    protected $primaryKey = 'id_orden';
    
    protected $fillable = [
        'codigo_unico',
        'tipo_origen',
        'id_inscripcion',
        'id_lista',
        'monto_total',
        'fecha_emision',
        'fecha_vencimiento',
        'estado',
    ];

    protected $casts = [
        'fecha_emision' => 'datetime',
        'fecha_vencimiento' => 'date',
    ];

    public function inscripcion()
    {
        return $this->belongsTo(Inscripcion::class, 'id_inscripcion');
    }

    public function lista()
    {
        return $this->belongsTo(ListaInscripcion::class, 'id_lista');
    }

    public function comprobantes()
    {
        return $this->hasMany(ComprobantePago::class, 'id_orden');
    }
}