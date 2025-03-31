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
        return $this->hasMany(ConvocatoriaNivel::class, 'id_convocatoria');
    }

    public function inscripciones()
    {
        return $this->hasManyThrough(
            Inscripcion::class,
            ConvocatoriaArea::class,
            'id_convocatoria', // FK en convocatoria_areas
            'id_convocatoria_area', // FK en inscripciones
            'id_convocatoria', // PK en convocatorias
            'id_convocatoria_area' // PK en convocatoria_areas
        );
    }
}