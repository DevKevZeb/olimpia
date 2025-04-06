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
    ];

    public function convocatoriaNiveles()
    {
        return $this->hasMany(ConvocatoriaNivel::class, 'id_nivel');
    }
}
