<?php

namespace Database\Seeders;

use App\Models\AreaCompetencia;
use Illuminate\Database\Seeder;

class AreasCompetenciaSeeder extends Seeder
{
    public function run()
    {
        $areas = [
            ['nombre_area' => 'Matemáticas'],
            ['nombre_area' => 'Ciencias Naturales'],
            ['nombre_area' => 'Lenguaje'],
            ['nombre_area' => 'Ciencias Sociales'],
        ];

        foreach ($areas as $area) {
            AreaCompetencia::create($area);
        }
    }
}