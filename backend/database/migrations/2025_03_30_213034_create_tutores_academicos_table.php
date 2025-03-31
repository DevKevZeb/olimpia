<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('tutores_academicos', function (Blueprint $table) {
            $table->id('id_tutor_academico');
            $table->string('nombres', 100);
            $table->string('apellidos', 100);
            $table->string('ci', 20)->unique();
            $table->string('telefono', 20)->nullable();
            $table->string('email', 100);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('tutores_academicos');
    }
};