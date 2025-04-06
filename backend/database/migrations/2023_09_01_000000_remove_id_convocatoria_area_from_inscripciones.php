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
        Schema::table('inscripciones', function (Blueprint $table) {
            // Si la columna existe, eliminarla
            if (Schema::hasColumn('inscripciones', 'id_convocatoria_area')) {
                $table->dropColumn('id_convocatoria_area');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inscripciones', function (Blueprint $table) {
            // Recrear la columna si es necesario restaurar
            if (!Schema::hasColumn('inscripciones', 'id_convocatoria_area')) {
                $table->foreignId('id_convocatoria_area')->nullable()->constrained('convocatoria_areas', 'id_convocatoria_area');
            }
        });
    }
};
