<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class ListaInscripcion extends Model
{
    use HasFactory;

    protected $table = 'listas_inscripcion';
    protected $primaryKey = 'id_lista';
    
    protected $fillable = [
        'fecha_creacion',
    ];

    protected $casts = [
        'fecha_creacion' => 'datetime',
    ];    
    public function detalles()
    {
        return $this->hasMany(DetalleListaInscripcion::class, 'id_lista');
    }    // Obtener la unidad educativa del primer estudiante de la lista
    // Necesario para mantener compatibilidad con el código existente  
    public function unidadEducativa()
    {
        // Usar el método directo que ya sabemos que funciona
        // En lugar de intentar hacer una relación compleja
        return $this->getUnidadEducativaDirecta();
    }

    // Crear un accessor para que funcione como atributo
    public function getUnidadEducativaAttribute()
    {
        return $this->getUnidadEducativaDirecta();
    }

    // Método alternativo para obtener la unidad educativa sin usar relaciones complejas
    public function getUnidadEducativaDirecta()
    {
        // Cachear la consulta para evitar múltiples ejecuciones
        if (!isset($this->unidadEducativaCache)) {
            $primerDetalle = $this->detalles()->with('estudiante.unidadEducativa')->first();
            $this->unidadEducativaCache = $primerDetalle ? $primerDetalle->estudiante->unidadEducativa : null;
        }
        return $this->unidadEducativaCache;
    }

    // Propiedad para cachear la unidad educativa
    private $unidadEducativaCache;

    public function ordenesPago()
    {
        return $this->hasMany(OrdenPago::class, 'id_lista');
    }

    public function encargadoPago()
    {
        return $this->hasMany(EncargadoPago::class, 'id_lista');
    }
}