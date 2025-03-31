<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Estudiante extends Model
{
    use HasFactory;

    protected $primaryKey = 'id_estudiante';
    protected $table = 'estudiantes';

    protected $fillable = [
        'nombres',
        'apellidos',
        'ci',
        'fecha_nacimiento',
        'email',
        'id_unidad_educativa',
        'id_grado',
        'id_tutor_legal'
    ];

    protected $casts = [
        'fecha_nacimiento' => 'date'
    ];

    public function unidadEducativa()
    {
        return $this->belongsTo(UnidadEducativa::class, 'id_unidad_educativa');
    }

    public function grado()
    {
        return $this->belongsTo(Grado::class, 'id_grado');
    }

    public function tutorLegal()
    {
        return $this->belongsTo(TutorLegal::class, 'id_tutor_legal');
    }

    public function inscripciones()
    {
        return $this->hasMany(Inscripcion::class, 'id_estudiante');
    }

    public function detallesLista()
    {
        return $this->hasMany(DetalleListaInscripcion::class, 'id_estudiante');
    }
}