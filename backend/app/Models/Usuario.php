<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Usuario extends Authenticatable
{
    use Notifiable;
    
    protected $table = 'Usuario';
    protected $primaryKey = 'Id_usuario';
    public $timestamps = false;
    
    protected $fillable = ['nombre', 'correo', 'contraseña', 'Id_rol'];
    
    protected $hidden = ['contraseña'];
    
    public function rol()
    {
        return $this->belongsTo(Rol::class, 'Id_rol');
    }
}
