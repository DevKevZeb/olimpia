<?php

namespace Database\Factories;

use App\Models\ListaInscripcion;
use Illuminate\Database\Eloquent\Factories\Factory;

class ListaInscripcionFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = ListaInscripcion::class;

    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'fecha_creacion' => now(),
        ];
    }
}
