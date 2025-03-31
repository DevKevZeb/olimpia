<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('areas_competencia', function (Blueprint $table) {
            $table->id('id_area');
            $table->string('nombre_area', 100)->unique();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('areas_competencia');
    }
};