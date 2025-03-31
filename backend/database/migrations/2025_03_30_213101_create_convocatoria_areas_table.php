<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('convocatoria_areas', function (Blueprint $table) {
            $table->id('id_convocatoria_area');
            $table->foreignId('id_convocatoria')->constrained('convocatorias', 'id_convocatoria');
            $table->foreignId('id_area')->constrained('areas_competencia', 'id_area');
            $table->decimal('costo_inscripcion', 10, 2);
            $table->timestamps();
            
            $table->unique(['id_convocatoria', 'id_area']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('convocatoria_areas');
    }
};