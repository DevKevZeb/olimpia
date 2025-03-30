<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Competidor extends Model
{
    protected $table = 'Competidor';
    protected $primaryKey = 'Id_competidor';
    public $timestamps = false;
    
    protected $fillable = [
        'nombre', 'apellido', 'email', 'ci', 'fecha_nacimiento',
        'colegio', 'Id_grado', 'departamento', 'provincia'
    ];
    
    public function grado()
    {
        return $this->belongsTo(Grado::class, 'Id_grado');
    }
    
    public function inscripciones()
    {
        return $this->hasMany(Inscripcion::class, 'Id_competidor');
    }
}
