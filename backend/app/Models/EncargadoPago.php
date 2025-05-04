<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EncargadoPago extends Model
{
    use HasFactory;

    protected $table = 'encargado_pago';
    protected $fillable = ['nombres', 'apellidos', 'ci', 'email', 'id_lista'];
    protected $guarded = ['id'];

    public function listaInscripcion()
    {
        return $this->belongsTo(ListaInscripcion::class, 'id_lista');
    }
}
