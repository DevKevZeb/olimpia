<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Inscripcion extends Model
{
    protected $table = 'Inscripcion';
    protected $primaryKey = 'Id_inscripcion';
    public $timestamps = false;
    
    protected $fillable = [
        'Id_competidor', 'Id_tutor', 'Id_area', 'Id_nivel',
        'estado', 'fecha', 'codigo', 'boleta_generada'
    ];
    
    public function competidor()
    {
        return $this->belongsTo(Competidor::class, 'Id_competidor');
    }
    
    public function tutor()
    {
        return $this->belongsTo(Tutor::class, 'Id_tutor');
    }
    
    public function area()
    {
        return $this->belongsTo(Area::class, 'Id_area');
    }
    
    public function nivel()
    {
        return $this->belongsTo(NivelCategoria::class, 'Id_nivel');
    }
    
    public function pagos()
    {
        return $this->hasMany(Pago::class, 'Id_inscripcion');
    }
}
