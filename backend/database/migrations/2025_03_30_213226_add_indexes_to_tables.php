<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('inscripciones', function (Blueprint $table) {
            $table->index(['id_estudiante', 'id_convocatoria_area'], 'idx_estudiante_convocatoria');
        });
        
        Schema::table('detalles_lista_inscripcion', function (Blueprint $table) {
            $table->index(['id_lista', 'id_estudiante'], 'idx_lista_estudiante');
        });
        
        Schema::table('ordenes_pago', function (Blueprint $table) {
            $table->index(['estado', 'fecha_emision'], 'idx_orden_estado');
        });
        
        Schema::table('comprobantes_pago', function (Blueprint $table) {
            $table->index(['estado_verificacion', 'fecha_pago'], 'idx_comprobante_verificacion');
        });
    }

    public function down()
    {
        Schema::table('inscripciones', function (Blueprint $table) {
            $table->dropIndex('idx_estudiante_convocatoria');
        });
        
        Schema::table('detalles_lista_inscripcion', function (Blueprint $table) {
            $table->dropIndex('idx_lista_estudiante');
        });
        
        Schema::table('ordenes_pago', function (Blueprint $table) {
            $table->dropIndex('idx_orden_estado');
        });
        
        Schema::table('comprobantes_pago', function (Blueprint $table) {
            $table->dropIndex('idx_comprobante_verificacion');
        });
    }
};