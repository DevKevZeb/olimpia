<?php

namespace Database\Seeders;

use App\Models\Grado;
use Illuminate\Database\Seeder;

class GradosSeeder extends Seeder
{
    public function run()
    {
        $grados = [
            ['nombre_grado' => '1ro Primaria', 'orden' => 1],
            ['nombre_grado' => '2do Primaria', 'orden' => 2],
            // ... hasta 6to primaria
            ['nombre_grado' => '1ro Secundaria', 'orden' => 7],
            // ... hasta 6to secundaria
            ['nombre_grado' => '6to Secundaria', 'orden' => 12],
        ];

        foreach ($grados as $grado) {
            Grado::create($grado);
        }
    }
}