<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('ordenes_pago', function (Blueprint $table) {
            $table->id('id_orden');
            $table->string('codigo_unico', 20)->unique();
            $table->enum('tipo_origen', ['individual', 'lista']);
            $table->foreignId('id_inscripcion')->nullable()->constrained('inscripciones', 'id_inscripcion');
            $table->foreignId('id_lista')->nullable()->constrained('listas_inscripcion', 'id_lista');
            $table->decimal('monto_total', 10, 2);
            $table->dateTime('fecha_emision');
            $table->date('fecha_vencimiento');
            $table->enum('estado', ['pendiente', 'pagada', 'vencida'])->default('pendiente');
            $table->timestamps();
            
            // Laravel no tiene CHECK constraints nativamente, esto se puede agregar con raw SQL
            // o validar a nivel de aplicación
        });
    }

    public function down()
    {
        Schema::dropIfExists('ordenes_pago');
    }
};