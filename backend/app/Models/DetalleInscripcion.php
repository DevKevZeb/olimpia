<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DetalleListaInscripcion extends Model
{
    use HasFactory;

    protected $primaryKey = 'id_detalle';
    protected $table = 'detalles_lista_inscripcion';

    protected $fillable = [
        'id_lista',
        'id_estudiante',
        'id_convocatoria_area',
        'id_convocatoria_nivel',
        'id_tutor_academico',
        'fecha_registro'
    ];

    protected $casts = [
        'fecha_registro' => 'datetime'
    ];

    public function lista()
    {
        return $this->belongsTo(ListaInscripcion::class, 'id_lista');
    }

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
}