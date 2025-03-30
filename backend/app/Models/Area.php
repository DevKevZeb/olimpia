<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Area extends Model
{
    protected $table = 'Area';
    protected $primaryKey = 'Id_area';
    public $timestamps = false;
    
    protected $fillable = ['nombre', 'descripcion'];
    
    public function costos()
    {
        return $this->hasMany(Costo::class, 'Id_area');
    }
    
    public function inscripciones()
    {
        return $this->hasMany(Inscripcion::class, 'Id_area');
    }
}
