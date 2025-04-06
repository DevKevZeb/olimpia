<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Convocatoria extends Model
{
    use HasFactory;

    protected $primaryKey = 'id_convocatoria';
    protected $table = 'convocatorias';

    protected $fillable = [
        'nombre',
        'fecha_inicio_inscripcion',
        'fecha_fin_inscripcion',
        'max_areas_por_estudiante',
        'estado'
    ];

    protected $casts = [
        'fecha_inicio_inscripcion' => 'date',
        'fecha_fin_inscripcion' => 'date',
    ];

    public function areas()
    {
        return $this->hasMany(ConvocatoriaArea::class, 'id_convocatoria');
    }

    public function niveles()
    {
        return $this->hasManyThrough(
            ConvocatoriaNivel::class,
            ConvocatoriaArea::class,
            'id_convocatoria', // FK en convocatoria_areas
            'id_convocatoria_area', // FK en convocatoria_niveles
            'id_convocatoria', // PK en convocatorias
            'id_convocatoria_area' // PK en convocatoria_areas
        );
    }

    public function inscripciones()
    {
        return $this->hasManyThrough(
            Inscripcion::class,
            ConvocatoriaNivel::class,
            'id_convocatoria_area', // FK en convocatoria_niveles que se relaciona con convocatoria_areas
            'id_convocatoria_nivel', // FK en inscripciones
            'id_convocatoria', // PK en convocatorias
            'id_convocatoria_nivel' // PK en convocatoria_niveles
        );
    }
}