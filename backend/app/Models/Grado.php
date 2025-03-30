<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Grado extends Model
{
    protected $table = 'Grado';
    protected $primaryKey = 'Id_grado';
    public $timestamps = false;
    
    protected $fillable = ['nombre'];
    
    public function competidores()
    {
        return $this->hasMany(Competidor::class, 'Id_grado');
    }
}
