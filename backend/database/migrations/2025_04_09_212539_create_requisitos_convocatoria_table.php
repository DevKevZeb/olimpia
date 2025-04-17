<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('requisitos_convocatoria', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_convocatoria'); // Cambiamos el nombre de la columna FK
            $table->string('entidad', 50);
            $table->string('campo', 50);
            $table->boolean('es_obligatorio')->default(false);
            $table->timestamps();

            $table->unique(['id_convocatoria', 'entidad', 'campo'], 'unique_requisito');
            $table->foreign('id_convocatoria')->references('id_convocatoria')->on('convocatorias')->onDelete('cascade'); // Ajustamos la FK
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('requisitos_convocatoria');
    }
};