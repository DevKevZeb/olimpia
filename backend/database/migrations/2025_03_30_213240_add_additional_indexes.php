<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // Añadir índice a la tabla convocatoria_areas para mejorar consultas por convocatoria
        Schema::table('convocatoria_areas', function (Blueprint $table) {
            $table->index(['id_convocatoria'], 'idx_convocatoria_areas_convocatoria');
        });

        // Añadir índice a la tabla convocatoria_niveles para mejorar consultas por nivel
        Schema::table('convocatoria_niveles', function (Blueprint $table) {
            $table->index(['id_nivel'], 'idx_convocatoria_niveles_nivel');
        });

        // Añadir índice a la tabla detalles_lista_inscripcion para mejorar consultas por convocatoria_nivel
        Schema::table('detalles_lista_inscripcion', function (Blueprint $table) {
            $table->index(['id_convocatoria_nivel'], 'idx_detalles_lista_convocatoria_nivel');
        });
    }

    public function down()
    {
        Schema::table('convocatoria_areas', function (Blueprint $table) {
            $table->dropIndex('idx_convocatoria_areas_convocatoria');
        });

        Schema::table('convocatoria_niveles', function (Blueprint $table) {
            $table->dropIndex('idx_convocatoria_niveles_nivel');
        });

        Schema::table('detalles_lista_inscripcion', function (Blueprint $table) {
            $table->dropIndex('idx_detalles_lista_convocatoria_nivel');
        });
    }
};
