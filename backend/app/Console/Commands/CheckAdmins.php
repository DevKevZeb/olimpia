<?php

namespace App\Console\Commands;

use App\Models\Admin;
use Illuminate\Console\Command;

class CheckAdmins extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'admin:list';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Listar todos los administradores del sistema';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $this->info('👥 Lista de Administradores');
        $this->info('==========================');

        $admins = Admin::all();

        if ($admins->isEmpty()) {
            $this->warn('⚠️  No hay administradores en el sistema.');
            $this->info('💡 Puedes crear uno con: php artisan admin:create');
            $this->info('💡 O ejecutar seeders con: php artisan db:seed --class=AdminSeeder');
            return 1;
        }

        $this->table(
            ['ID', 'Nombre', 'Email', 'Estado', 'Creado'],
            $admins->map(function ($admin) {
                return [
                    $admin->id_admin,
                    $admin->nombre,
                    $admin->email,
                    $admin->activo ? '✅ Activo' : '❌ Inactivo',
                    $admin->created_at->format('Y-m-d H:i:s')
                ];
            })
        );

        $this->info("📊 Total: {$admins->count()} administrador(es)");

        return 0;
    }
}
