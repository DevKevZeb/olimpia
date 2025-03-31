<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TutorAcademico extends Model
{
    use HasFactory;

    protected $primaryKey = 'id_tutor_academico';
    protected $table = 'tutores_academicos';

    protected $fillable = [
        'nombres',
        'apellidos',
        'ci',
        'telefono',
        'email'
    ];

    public function inscripciones()
    {
        return $this->hasMany(Inscripcion::class, 'id_tutor_academico');
    }

    public function detallesLista()
    {
        return $this->hasMany(DetalleListaInscripcion::class, 'id_tutor_academico');
    }
}