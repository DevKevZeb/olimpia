<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inscripcion extends Model
{
    use HasFactory;

    protected $primaryKey = 'id_inscripcion';
    protected $table = 'inscripciones';

    protected $fillable = [
        'id_estudiante',
        'id_convocatoria_area',
        'id_convocatoria_nivel',
        'id_tutor_academico',
        'fecha_inscripcion',
        'estado',
    ];

    protected $casts = [
        'fecha_inscripcion' => 'datetime',
    ];

    public function estudiante()
    {
        return $this->belongsTo(Estudiante::class, 'id_estudiante');
    }

    public function convocatoriaArea()
    {
        return $this->belongsTo(ConvocatoriaArea::class, 'id_convocatoria_area');
    }

    public function convocatoriaNivel()
    {
        return $this->belongsTo(ConvocatoriaNivel::class, 'id_convocatoria_nivel');
    }

    public function tutorAcademico()
    {
        return $this->belongsTo(TutorAcademico::class, 'id_tutor_academico');
    }

    public function ordenesPago()
    {
        return $this->hasMany(OrdenPago::class, 'id_inscripcion');
    }
}