<?php

namespace Database\Factories;

use App\Models\OrdenPago;
use App\Models\ListaInscripcion;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class OrdenPagoFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = OrdenPago::class;

    /**
     * Define the model's default state.
     *
     * @return array
     */    public function definition()
    {
        return [
            'codigo_unico' => 'O-SANSI-2024-' . $this->faker->numberBetween(10000, 99999),
            'tipo_origen' => 'lista',
            'id_lista' => ListaInscripcion::factory(),
            'monto_total' => $this->faker->randomFloat(2, 100, 1000),
            'fecha_emision' => now(),
            'fecha_vencimiento' => now()->addDays(5),
            'estado' => 'pendiente',
        ];
    }

    /**
     * Indicate that the order is paid.
     *
     * @return \Illuminate\Database\Eloquent\Factories\Factory
     */
    public function paid()
    {
        return $this->state(function (array $attributes) {
            return [
                'estado' => 'pagada',
            ];
        });
    }

    /**
     * Indicate that the order is expired.
     *
     * @return \Illuminate\Database\Eloquent\Factories\Factory
     */
    public function expired()
    {
        return $this->state(function (array $attributes) {
            return [
                'estado' => 'vencida',
                'fecha_vencimiento' => now()->subDays(1),
            ];
        });
    }
}
