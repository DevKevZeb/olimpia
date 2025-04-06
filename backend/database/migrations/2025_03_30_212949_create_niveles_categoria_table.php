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
            $table->string('nombre_nivel', 100)->unique();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('niveles_categoria');
    }
};
