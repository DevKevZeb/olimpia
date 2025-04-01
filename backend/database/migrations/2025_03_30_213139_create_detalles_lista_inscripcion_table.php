<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('detalles_lista_inscripcion', function (Blueprint $table) {
            $table->id('id_detalle');
            $table->foreignId('id_lista')->constrained('listas_inscripcion', 'id_lista')->cascadeOnDelete();
            $table->foreignId('id_estudiante')->constrained('estudiantes', 'id_estudiante');
            $table->foreignId('id_convocatoria_area')->constrained('convocatoria_areas', 'id_convocatoria_area');
            $table->foreignId('id_convocatoria_nivel')->constrained('convocatoria_niveles', 'id_convocatoria_nivel');
            $table->foreignId('id_tutor_academico')->nullable()->constrained('tutores_academicos', 'id_tutor_academico');
            $table->dateTime('fecha_registro');
            $table->timestamps();
            
            $table->unique(['id_lista', 'id_estudiante', 'id_convocatoria_area'], 'unique_detalle_lista_est_area');
        });
    }

    public function down()
    {
        Schema::dropIfExists('detalles_lista_inscripcion');
    }
};