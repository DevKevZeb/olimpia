<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConvocatoriaArea extends Model
{
    use HasFactory;

    protected $table = 'convocatoria_areas';
    protected $primaryKey = 'id_convocatoria_area';
    
    protected $fillable = [
        'id_convocatoria',
        'id_area',
        'costo_inscripcion',
    ];

    public function convocatoria()
    {
        return $this->belongsTo(Convocatoria::class, 'id_convocatoria');
    }

    public function area()
    {
        return $this->belongsTo(AreaCompetencia::class, 'id_area');
    }

    public function inscripciones()
    {
        return $this->hasMany(Inscripcion::class, 'id_convocatoria_area');
    }
}