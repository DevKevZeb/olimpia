<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('comprobantes_pago', function (Blueprint $table) {
            $table->id('id_comprobante');
            $table->foreignId('id_orden')->constrained('ordenes_pago', 'id_orden');
            $table->string('numero_comprobante', 50);
            $table->string('nombre_pagador', 100);
            $table->dateTime('fecha_pago');
            $table->decimal('monto_pagado', 10, 2);
            $table->binary('pdf_comprobante');
            $table->json('datos_ocr')->nullable();
            $table->enum('estado_verificacion', ['pendiente', 'verificado', 'rechazado'])->default('pendiente');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('comprobantes_pago');
    }
};