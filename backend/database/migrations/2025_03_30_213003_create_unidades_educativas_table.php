<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('unidades_educativas', function (Blueprint $table) {
            $table->id('id_unidad_educativa');
            $table->string('nombre', 200);
            $table->string('departamento', 100);
            $table->string('provincia', 100);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('unidades_educativas');
    }
};