<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tutor extends Model
{
    protected $table = 'Tutor';
    protected $primaryKey = 'Id_tutor';
    public $timestamps = false;
    
    protected $fillable = ['nombre', 'apellido', 'tipo_tutor', 'telefono', 'email'];
    
    public function inscripciones()
    {
        return $this->hasMany(Inscripcion::class, 'Id_tutor');
    }
}
