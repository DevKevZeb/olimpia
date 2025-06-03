<?php

namespace Database\Seeders;

use App\Models\Admin;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Verificar si ya existe un administrador
        if (Admin::where('email', 'admin@ohsansi.com')->exists()) {
            echo "ℹ️  El administrador por defecto ya existe.\n";
            echo "📧 Email: admin@ohsansi.com\n";
            echo "🔑 Password: admin123\n";
            return;
        }

        // Crear administrador por defecto
        $admin = Admin::create([
            'nombre' => 'Administrador',
            'email' => 'admin@ohsansi.com',
            'password' => Hash::make('admin123'),
            'activo' => true,
        ]);

        echo "✅ Admin creado exitosamente:\n";
        echo "📧 Email: admin@ohsansi.com\n";
        echo "🔑 Password: admin123\n";
        echo "🆔 ID: {$admin->id_admin}\n";
        echo "💡 Guarda estas credenciales para acceder al panel de administración.\n";
    }
}
