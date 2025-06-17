<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

use App\Models\Grado;
use App\Models\ConvocatoriaArea;
use App\Models\NivelCategoria;

class ConvocatoriaNivel extends Model

{
    use HasFactory;

    protected $table = 'convocatoria_niveles';
    protected $primaryKey = 'id_convocatoria_nivel';

    protected $fillable = [
        'id_convocatoria_area',
        'id_nivel',
        'id_grado_min',
        'id_grado_max',
    ];

    public function convocatoriaArea()
    {
        return $this->belongsTo(ConvocatoriaArea::class, 'id_convocatoria_area');
    }

    public function nivel()
    {
        return $this->belongsTo(NivelCategoria::class, 'id_nivel');
    }

    // Cambiando el nombre del método de gradoMin a gradoMinimo para que coincida con la llamada en el controlador
    public function gradoMinimo()
    {
        return $this->belongsTo(Grado::class, 'id_grado_min');    }

    // Cambiando el nombre del método de gradoMax a gradoMaximo para que coincida con la llamada en el controlador
    public function gradoMaximo()
    {
        return $this->belongsTo(Grado::class, 'id_grado_max');
    }

    // Replaced inscripciones() relationship since Inscripcion model was deleted
    // All registrations now go through detalles_lista_inscripcion
    public function detallesLista()
    {
        return $this->hasMany(DetalleListaInscripcion::class, 'id_convocatoria_nivel');
    }

    public function scopeForGradoAndConvocatoria(Builder $query, int $idGrado, int $idConvocatoria): Builder
    {
        return $query->whereHas('convocatoriaArea', function ($subQuery) use ($idConvocatoria) {
                $subQuery->where('id_convocatoria', $idConvocatoria);
            })
            ->where('id_grado_min', '<=', $idGrado)
            ->where('id_grado_max', '>=', $idGrado);
    }
}
