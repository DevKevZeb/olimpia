<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Estudiante extends Model
{
    use HasFactory;

    protected $table = 'estudiantes';
    protected $primaryKey = 'id_estudiante';
    
    protected $fillable = [
        'nombres',
        'apellidos',
        'ci',
        'fecha_nacimiento',
        'genero',
        'telefono',
        'email',
        'id_unidad_educativa',
        'id_grado',
        'id_tutor_legal',
    ];

    protected $casts = [
        'fecha_nacimiento' => 'date',
    ];

    public function unidadEducativa()
    {
        return $this->belongsTo(UnidadEducativa::class, 'id_unidad_educativa');
    }

    public function grado()
    {
        return $this->belongsTo(Grado::class, 'id_grado');
    }    public function tutorLegal()
    {
        return $this->belongsTo(TutorLegal::class, 'id_tutor_legal');
    }

    public function detallesLista()
    {
        return $this->hasMany(DetalleListaInscripcion::class, 'id_estudiante', 'id_estudiante');
    }
    /**
     * Intenta eliminar el estudiante después de verificar dependencias.
     *
     * @return bool
     * @throws \Exception Si el estudiante tiene registros asociados.
     */
    public function deleteIfNoDependencies(): bool
    {
        if ($this->detallesLista()->exists()) {
            throw new \Exception('No se puede eliminar el estudiante porque tiene registros asociados', 409);
        }
        return $this->delete();
    }

    /**
     * Scope para buscar estudiantes por nombre, apellido o CI.
     */
    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        if (!$search) {
            return $query; // No aplicar filtro si no hay término de búsqueda
        }
        return $query->where('nombres', 'like', "%{$search}%")
                     ->orWhere('apellidos', 'like', "%{$search}%")
                     ->orWhere('ci', 'like', "%{$search}%");
    }
}