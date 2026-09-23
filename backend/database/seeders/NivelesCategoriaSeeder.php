<?php

namespace Database\Seeders;

use App\Models\NivelCategoria;
use Illuminate\Database\Seeder;

class NivelesCategoriaSeeder extends Seeder
{
    public function run()
    {
        // El rango de grados y el área se asignan por convocatoria (convocatoria_niveles)
        $niveles = [
            'Básico Primaria',
            'Avanzado Secundaria',
        ];

        foreach ($niveles as $nombre) {
            NivelCategoria::firstOrCreate(['nombre_nivel' => $nombre]);
        }
    }
}