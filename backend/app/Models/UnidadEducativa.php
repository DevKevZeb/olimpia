<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UnidadEducativa extends Model
{
    use HasFactory;

    protected $table = 'unidades_educativas';
    protected $primaryKey = 'id_unidad_educativa';
    
    protected $fillable = [
        'nombre',
        'departamento',
        'provincia',
    ];

    public function estudiantes()
    {
        return $this->hasMany(Estudiante::class, 'id_unidad_educativa');
    }

    public function listasInscripcion()
    {
        return $this->hasMany(ListaInscripcion::class, 'id_unidad_educativa');
    }
}