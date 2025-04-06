<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('convocatoria_niveles', function (Blueprint $table) {
            $table->id('id_convocatoria_nivel');
            $table->foreignId('id_convocatoria_area')->constrained('convocatoria_areas', 'id_convocatoria_area');
            $table->foreignId('id_nivel')->constrained('niveles_categoria', 'id_nivel');
            $table->foreignId('id_grado_min')->constrained('grados', 'id_grado');
            $table->foreignId('id_grado_max')->constrained('grados', 'id_grado');
            $table->timestamps();

            $table->unique(['id_convocatoria_area', 'id_nivel']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('convocatoria_niveles');
    }
};
