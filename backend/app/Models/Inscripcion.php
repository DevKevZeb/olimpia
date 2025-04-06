<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inscripcion extends Model
{
    use HasFactory;

    protected $table = 'inscripciones';
    protected $primaryKey = 'id_inscripcion';

    protected $fillable = [
        'id_estudiante',
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

    // Método auxiliar para acceder a ConvocatoriaArea a través de ConvocatoriaNivel
    public function getConvocatoriaAreaAttribute()
    {
        return $this->convocatoriaNivel->convocatoriaArea;
    }
}
