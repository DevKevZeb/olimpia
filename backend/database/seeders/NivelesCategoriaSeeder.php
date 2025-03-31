<?php

namespace Database\Seeders;

use App\Models\NivelCategoria;
use Illuminate\Database\Seeder;

class NivelesCategoriaSeeder extends Seeder
{
    public function run()
    {
        $niveles = [
            [
                'nombre_nivel' => 'Básico Primaria',
                'id_area' => 1, // Matemáticas
                'id_grado_min' => 1, // 1ro Primaria
                'id_grado_max' => 6, // 6to Primaria
            ],
            [
                'nombre_nivel' => 'Avanzado Secundaria',
                'id_area' => 1, // Matemáticas
                'id_grado_min' => 7, // 1ro Secundaria
                'id_grado_max' => 12, // 6to Secundaria
            ],
            // ... otros niveles
        ];

        foreach ($niveles as $nivel) {
            NivelCategoria::create($nivel);
        }
    }
}