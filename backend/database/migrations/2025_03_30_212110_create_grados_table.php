<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('grados', function (Blueprint $table) {
            $table->id('id_grado');
            $table->string('nombre_grado', 50)->unique();
            $table->integer('orden')->unique()->comment('Para ordenamiento jerárquico (1=1ro Primaria, 12=6to Secundaria)');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('grados');
    }
};