<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NivelCategoria extends Model
{
    protected $table = 'NivelCategoria';
    protected $primaryKey = 'Id_nivel';
    public $timestamps = false;
    
    protected $fillable = ['nombre'];
    
    public function costos()
    {
        return $this->hasMany(Costo::class, 'Id_nivel');
    }
    
    public function inscripciones()
    {
        return $this->hasMany(Inscripcion::class, 'Id_nivel');
    }
}
