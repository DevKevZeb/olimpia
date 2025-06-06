<?php

namespace Database\Factories;

use App\Models\EncargadoPago;
use App\Models\ListaInscripcion;
use Illuminate\Database\Eloquent\Factories\Factory;

class EncargadoPagoFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = EncargadoPago::class;

    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'nombres' => $this->faker->firstName,
            'apellidos' => $this->faker->lastName,
            'ci' => $this->faker->numberBetween(1000000, 9999999),
            'email' => $this->faker->safeEmail,
            'id_lista' => ListaInscripcion::factory(),
        ];
    }
}
