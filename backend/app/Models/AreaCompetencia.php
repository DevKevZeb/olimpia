<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AreaCompetencia extends Model
{
    use HasFactory;

    protected $table = 'areas_competencia';
    protected $primaryKey = 'id_area';
    
    protected $fillable = [
        'nombre_area',
    ];

    public function nivelesCategoria()
    {
        return $this->hasMany(NivelCategoria::class, 'id_area');
    }

    public function convocatoriaAreas()
    {
        return $this->hasMany(ConvocatoriaArea::class, 'id_area');
    }
}