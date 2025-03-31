<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Grado extends Model
{
    use HasFactory;

    protected $primaryKey = 'id_grado';
    protected $table = 'grados';

    protected $fillable = [
        'nombre_grado',
        'orden'
    ];

    public function nivelesComoMinimo()
    {
        return $this->hasMany(NivelCategoria::class, 'id_grado_min');
    }

    public function nivelesComoMaximo()
    {
        return $this->hasMany(NivelCategoria::class, 'id_grado_max');
    }

    public function estudiantes()
    {
        return $this->hasMany(Estudiante::class, 'id_grado');
    }
}