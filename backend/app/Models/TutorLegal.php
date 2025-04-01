<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TutorLegal extends Model
{
    use HasFactory;

    protected $table = 'tutores_legales';
    protected $primaryKey = 'id_tutor_legal';
    
    protected $fillable = [
        'nombres',
        'apellidos',
        'ci',
        'telefono',
        'email',
        'parentesco',
        'es_el_mismo_estudiante',
    ];

    protected $casts = [
        'es_el_mismo_estudiante' => 'boolean',
    ];

    public function estudiantes()
    {
        return $this->hasMany(Estudiante::class, 'id_tutor_legal');
    }
}