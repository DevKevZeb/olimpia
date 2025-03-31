<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ListaInscripcion extends Model
{
    use HasFactory;

    protected $primaryKey = 'id_lista';
    protected $table = 'listas_inscripcion';

    protected $fillable = [
        'codigo_lista',
        'id_unidad_educativa',
        'fecha_creacion'
    ];

    protected $casts = [
        'fecha_creacion' => 'datetime'
    ];

    public function unidadEducativa()
    {
        return $this->belongsTo(UnidadEducativa::class, 'id_unidad_educativa');
    }

    public function detalles()
    {
        return $this->hasMany(DetalleListaInscripcion::class, 'id_lista');
    }

    public function ordenesPago()
    {
        return $this->hasMany(OrdenPago::class, 'id_lista');
    }
}