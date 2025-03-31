<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('tutores_legales', function (Blueprint $table) {
            $table->id('id_tutor_legal');
            $table->string('nombres', 100);
            $table->string('apellidos', 100);
            $table->string('ci', 20)->unique();
            $table->string('telefono', 20);
            $table->string('email', 100)->nullable();
            $table->string('parentesco', 50)->comment('Padre, Madre, Tutor legal');
            $table->boolean('es_el_mismo_estudiante')->default(false);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('tutores_legales');
    }
};