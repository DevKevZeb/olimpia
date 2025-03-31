<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use App\Models\Inscripcion;
use App\Models\ComprobantePago;
use App\Observers\InscripcionObserver;
use App\Observers\ComprobantePagoObserver;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        // ...
    ];

    public function boot()
    {
        Inscripcion::observe(InscripcionObserver::class);
        ComprobantePago::observe(ComprobantePagoObserver::class);
    }
}