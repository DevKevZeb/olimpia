<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('niveles_categoria', function (Blueprint $table) {
            $table->id('id_nivel');
            $table->string('nombre_nivel', 100);
            $table->foreignId('id_area')->constrained('areas_competencia', 'id_area');
            $table->foreignId('id_grado_min')->constrained('grados', 'id_grado');
            $table->foreignId('id_grado_max')->constrained('grados', 'id_grado');
            $table->timestamps();
            
            $table->unique(['id_area', 'nombre_nivel']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('niveles_categoria');
    }
};