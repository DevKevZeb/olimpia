<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateEncargadoPago extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up(): void
    {
        Schema::create('encargado_pago', function (Blueprint $table) {
            $table->id(); // Columna autoincremental 'id' (clave primaria)
            $table->string('nombres');
            $table->string('apellidos');
            $table->string('ci'); // 'ci' será único
            $table->string('email'); // 'email' será único y puede ser nulo
            $table->unsignedBigInteger('id_lista'); // Clave foránea a lista_inscripcion
            $table->foreign('id_lista')->references('id_lista')->on('listas_inscripcion')->onDelete('cascade'); // Definición de la clave foránea
            $table->timestamps(); // 'created_at' y 'updated_at'
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('encargado_pago');
    }
}
