<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RequisitoConvocatoria extends Model
{
    protected $table = 'requisitos_convocatoria';
    protected $primaryKey = 'id';
    public $timestamps = true;

    protected $fillable = [
        'id_convocatoria',
        'entidad',
        'campo',
        'es_obligatorio',
    ];

    protected $casts = [
        'es_obligatorio' => 'boolean',
    ];

    /**
     * Define the relationship with the ConvocatoriaCampos model.
     */
    public function convocatoria(): BelongsTo
    {
        return $this->belongsTo(Convocatoria::class, 'id_convocatoria', 'id_convocatoria');
    }
}