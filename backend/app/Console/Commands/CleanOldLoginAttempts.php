<?php

namespace App\Console\Commands;

use App\Models\LoginAttempt;
use Illuminate\Console\Command;

class CleanOldLoginAttempts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'auth:clean-login-attempts {--days=7 : Número de días de antigüedad para limpiar}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Limpiar intentos de login antiguos para mantener la base de datos optimizada';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $days = $this->option('days');
        
        $this->info("Limpiando intentos de login de más de {$days} días...");
        
        $deletedCount = LoginAttempt::clearOldAttempts($days);
        
        $this->info("Se eliminaron {$deletedCount} registros antiguos.");
        
        return Command::SUCCESS;
    }
}
