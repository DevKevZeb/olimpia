<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TutorAcademico extends Model
{
    use HasFactory;

    protected $table = 'tutores_academicos';
    protected $primaryKey = 'id_tutor_academico';
      protected $fillable = [
        'nombres',
        'apellidos',
        'ci',
        'telefono',
        'email',
    ];

    // Replaced inscripciones() relationship since Inscripcion model was deleted
    // All registrations now go through detalles_lista_inscripcion
    public function detallesLista()
    {
        return $this->hasMany(DetalleListaInscripcion::class, 'id_tutor_academico');
    }
}