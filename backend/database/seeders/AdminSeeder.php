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
        // Crear administrador por defecto
        Admin::create([
            'nombre' => 'Administrador',
            'email' => 'admin@ohsansi.com',
            'password' => Hash::make('admin123'),
            'activo' => true,
        ]);

        echo "✅ Admin creado exitosamente:\n";
        echo "📧 Email: admin@ohsansi.com\n";
        echo "🔑 Password: admin123\n";
    }
}
