<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Models\OrdenPago;
use Illuminate\Support\Facades\DB;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        //
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
