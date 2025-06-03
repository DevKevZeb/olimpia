<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{    public function run()
    {
        $this->call([
            AdminSeeder::class, // Crear usuario administrador
            GradosSeeder::class,
            AreasCompetenciaSeeder::class,
            NivelesCategoriaSeeder::class,
            UnidadesEducativasSeeder::class,
            TutoresLegalesSeeder::class,
            TutoresAcademicosSeeder::class,
            EstudiantesSeeder::class,
            ConvocatoriasSeeder::class,
            ConvocatoriaAreasSeeder::class,
            ConvocatoriaNivelesSeeder::class,
        ]);
    }
}