<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Convocatoria;

class CerrarConvocatoriasExpiradas extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'convocatorias:cerrar-expiradas';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Cierra automáticamente las convocatorias que han pasado su fecha de fin de inscripción';

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
        $this->info('Verificando convocatorias expiradas...');
        
        $convocatorias = Convocatoria::paraCerrarAutomaticamente()->get();
        
        if ($convocatorias->isEmpty()) {
            $this->info('No hay convocatorias para cerrar.');
            return 0;
        }

        $cerradas = 0;
        
        foreach ($convocatorias as $convocatoria) {
            $resultado = $convocatoria->transicionarEstado('cerrada');
            
            if ($resultado['success']) {
                $cerradas++;
                $this->info("✓ Convocatoria '{$convocatoria->nombre}' cerrada automáticamente");
            } else {
                $this->error("✗ Error al cerrar convocatoria '{$convocatoria->nombre}': {$resultado['message']}");
            }
        }

        $this->info("Proceso completado. {$cerradas} convocatorias cerradas de {$convocatorias->count()} verificadas.");
        
        return 0;
    }
}
