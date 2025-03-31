<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('inscripciones', function (Blueprint $table) {
            $table->id('id_inscripcion');
            $table->foreignId('id_estudiante')->constrained('estudiantes', 'id_estudiante');
            $table->foreignId('id_convocatoria_area')->constrained('convocatoria_areas', 'id_convocatoria_area');
            $table->foreignId('id_convocatoria_nivel')->constrained('convocatoria_niveles', 'id_convocatoria_nivel');
            $table->foreignId('id_tutor_academico')->nullable()->constrained('tutores_academicos', 'id_tutor_academico');
            $table->dateTime('fecha_inscripcion');
            $table->enum('estado', ['pendiente', 'pagada', 'verificada'])->default('pendiente');
            $table->timestamps();
            
            $table->unique(['id_estudiante', 'id_convocatoria_area']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('inscripciones');
    }
};