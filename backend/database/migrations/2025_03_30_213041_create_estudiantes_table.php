<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('estudiantes', function (Blueprint $table) {
            $table->id('id_estudiante');
            $table->string('nombres', 100);
            $table->string('apellidos', 100);
            $table->string('ci', 20)->unique();
            $table->date('fecha_nacimiento');
            $table->string('email', 100)->nullable();
            $table->foreignId('id_unidad_educativa')->constrained('unidades_educativas', 'id_unidad_educativa');
            $table->foreignId('id_grado')->constrained('grados', 'id_grado');
            $table->foreignId('id_tutor_legal')->constrained('tutores_legales', 'id_tutor_legal');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('estudiantes');
    }
};