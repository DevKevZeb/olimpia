<?php

namespace App\Console\Commands;

use App\Models\Admin;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class CreateAdminUser extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'admin:create 
                            {--email= : Email del administrador}
                            {--password= : Contraseña del administrador}
                            {--name= : Nombre del administrador}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Crear un nuevo usuario administrador';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $this->info('🔧 Creador de Usuario Administrador');
        $this->info('=====================================');

        // Obtener datos del usuario
        $email = $this->option('email') ?: $this->ask('📧 Email del administrador');
        $password = $this->option('password') ?: $this->secret('🔑 Contraseña del administrador');
        $name = $this->option('name') ?: $this->ask('👤 Nombre del administrador');

        // Validar datos
        $validator = Validator::make([
            'email' => $email,
            'password' => $password,
            'name' => $name,
        ], [
            'email' => 'required|email|unique:administradores,email',
            'password' => 'required|min:6',
            'name' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            $this->error('❌ Error en los datos:');
            foreach ($validator->errors()->all() as $error) {
                $this->error("   • $error");
            }
            return 1;
        }

        try {
            // Crear el administrador
            $admin = Admin::create([
                'nombre' => $name,
                'email' => $email,
                'password' => Hash::make($password),
                'activo' => true,
            ]);

            $this->info('');
            $this->info('✅ ¡Administrador creado exitosamente!');
            $this->info('=====================================');
            $this->info("👤 Nombre: {$admin->nombre}");
            $this->info("📧 Email: {$admin->email}");
            $this->info("🔑 Contraseña: {$password}");
            $this->info("🆔 ID: {$admin->id_admin}");
            $this->info('');
            $this->info('💡 Ahora puedes usar estas credenciales para iniciar sesión.');

            return 0;
        } catch (\Exception $e) {
            $this->error("❌ Error al crear administrador: {$e->getMessage()}");
            return 1;
        }
    }
}
