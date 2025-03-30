<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rol extends Model
{
    protected $table = 'Rol';
    protected $primaryKey = 'Id_rol';
    public $timestamps = false;
    
    protected $fillable = ['nombre'];
    
    public function usuarios()
    {
        return $this->hasMany(Usuario::class, 'Id_rol');
    }
}
