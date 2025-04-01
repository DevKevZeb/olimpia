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
        'id_convocatoria',
        'id_nivel',
    ];

    public function convocatoria()
    {
        return $this->belongsTo(Convocatoria::class, 'id_convocatoria');
    }

    public function nivel()
    {
        return $this->belongsTo(NivelCategoria::class, 'id_nivel');
    }

    public function inscripciones()
    {
        return $this->hasMany(Inscripcion::class, 'id_convocatoria_nivel');
    }
}