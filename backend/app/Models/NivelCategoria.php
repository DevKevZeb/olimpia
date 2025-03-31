<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NivelCategoria extends Model
{
    use HasFactory;

    protected $primaryKey = 'id_nivel';
    protected $table = 'niveles_categoria';

    protected $fillable = [
        'nombre_nivel',
        'id_area',
        'id_grado_min',
        'id_grado_max'
    ];

    public function area()
    {
        return $this->belongsTo(AreaCompetencia::class, 'id_area');
    }

    public function gradoMin()
    {
        return $this->belongsTo(Grado::class, 'id_grado_min');
    }

    public function gradoMax()
    {
        return $this->belongsTo(Grado::class, 'id_grado_max');
    }

    public function convocatoriasNiveles()
    {
        return $this->hasMany(ConvocatoriaNivel::class, 'id_nivel');
    }
}