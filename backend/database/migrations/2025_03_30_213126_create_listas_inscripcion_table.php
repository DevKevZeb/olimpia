<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('listas_inscripcion', function (Blueprint $table) {
            $table->id('id_lista');
            $table->string('codigo_lista', 20)->unique();
            $table->foreignId('id_unidad_educativa')->constrained('unidades_educativas', 'id_unidad_educativa');
            $table->dateTime('fecha_creacion');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('listas_inscripcion');
    }
};