<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Models\OrdenPago;
use Illuminate\Support\Facades\DB;

// Registrar servicios de la arquitectura SOA
use App\Services\ConvocatoriaService;
use App\Services\ConvocatoriaConfiguracionService;
use App\Services\ConvocatoriaEstadoService;
use App\Services\DatosReferenciaService;
use App\Repositories\ConvocatoriaRepository;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        // Registrar Repository
        $this->app->singleton(ConvocatoriaRepository::class, function ($app) {
            return new ConvocatoriaRepository();
        });

        // Registrar Services
        $this->app->singleton(ConvocatoriaService::class, function ($app) {
            return new ConvocatoriaService(
                $app->make(ConvocatoriaRepository::class)
            );
        });

        $this->app->singleton(ConvocatoriaConfiguracionService::class, function ($app) {
            return new ConvocatoriaConfiguracionService();
        });

        $this->app->singleton(ConvocatoriaEstadoService::class, function ($app) {
            return new ConvocatoriaEstadoService();
        });

        $this->app->singleton(DatosReferenciaService::class, function ($app) {
            return new DatosReferenciaService();
        });
    }

    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        // Remove wrapping of JSON resources
        JsonResource::withoutWrapping();
        
        // Add storage symbolic link to public directory
        if (!file_exists(public_path('storage'))) {
            $this->app->make('Illuminate\Contracts\Console\Kernel')->call('storage:link');
        }
    }
}
