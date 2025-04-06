<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConvocatoriaNivel extends Model
{
    use HasFactory;

    protected $table = 'convocatoria_niveles';
    protected $primaryKey = 'id_convocatoria_nivel';

    protected $fillable = [
        'id_convocatoria_area',
        'id_nivel',
        'id_grado_min',
        'id_grado_max',
    ];

    public function convocatoriaArea()
    {
        return $this->belongsTo(ConvocatoriaArea::class, 'id_convocatoria_area');
    }

    public function nivel()
    {
        return $this->belongsTo(NivelCategoria::class, 'id_nivel');
    }

    public function gradoMin()
    {
        return $this->belongsTo(Grado::class, 'id_grado_min');
    }

    public function gradoMax()
    {
        return $this->belongsTo(Grado::class, 'id_grado_max');
    }

    public function inscripciones()
    {
        return $this->hasMany(Inscripcion::class, 'id_convocatoria_nivel');
    }
}
