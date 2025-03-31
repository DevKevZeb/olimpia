<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AreaCompetencia extends Model
{
    use HasFactory;

    protected $primaryKey = 'id_area';
    protected $table = 'areas_competencia';

    protected $fillable = [
        'nombre_area'
    ];

    public function niveles()
    {
        return $this->hasMany(NivelCategoria::class, 'id_area');
    }

    public function convocatoriasAreas()
    {
        return $this->hasMany(ConvocatoriaArea::class, 'id_area');
    }
}