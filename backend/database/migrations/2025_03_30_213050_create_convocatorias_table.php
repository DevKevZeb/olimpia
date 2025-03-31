<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('convocatorias', function (Blueprint $table) {
            $table->id('id_convocatoria');
            $table->string('nombre', 100);
            $table->date('fecha_inicio_inscripcion');
            $table->date('fecha_fin_inscripcion');
            $table->integer('max_areas_por_estudiante')->default(2);
            $table->enum('estado', ['planificada', 'abierta', 'cerrada', 'finalizada'])->default('planificada');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('convocatorias');
    }
};