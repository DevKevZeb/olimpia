<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Costo extends Model
{
    protected $table = 'Costo';
    protected $primaryKey = 'Id_costo';
    public $timestamps = false;
    
    protected $fillable = ['Id_area', 'Id_nivel', 'monto'];
    
    public function area()
    {
        return $this->belongsTo(Area::class, 'Id_area');
    }
    
    public function nivel()
    {
        return $this->belongsTo(NivelCategoria::class, 'Id_nivel');
    }
}
