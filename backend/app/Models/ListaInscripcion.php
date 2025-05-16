<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ListaInscripcion extends Model
{
    use HasFactory;

    protected $table = 'listas_inscripcion';
    protected $primaryKey = 'id_lista';
    
    protected $fillable = [
        'fecha_creacion',
    ];

    protected $casts = [
        'fecha_creacion' => 'datetime',
    ];

    public function detalles()
    {
        return $this->hasMany(DetalleListaInscripcion::class, 'id_lista');
    }

    public function ordenesPago()
    {
        return $this->hasMany(OrdenPago::class, 'id_lista');
    }

    public function encargadoPago()
    {
        return $this->hasMany(EncargadoPago::class, 'id_lista');
    }
}