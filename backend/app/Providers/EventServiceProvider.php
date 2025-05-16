<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use App\Models\ComprobantePago;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        // ...
    ];

    public function boot()
    {
    }
}