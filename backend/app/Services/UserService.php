<?php
namespace App\Services;
use App\Models\Estudiante;
use App\Models\TutorLegal; // Asume que también tienes un modelo TutorLegal

class UserService
{
    public function searchUserByCi(string $ci, string $userType): ?array
    {
        $result = null;
        switch ($userType) {
            case 'estudiantes':
                $estudiante = Estudiante::where('ci', $ci)->latest()->first();
                if ($estudiante) {
                    $result = $estudiante->only(['nombres', 'apellidos', 'ci', 'email', 'created_at']);
                }
                break;
            case 'tutores_legales': // Asume que esta es tu otra tabla
                $tutor = TutorLegal::where('ci', $ci)->latest()->first();
                if ($tutor) {
                    $result = $tutor->only(['nombres', 'apellidos', 'ci', 'email', 'telefono', 'created_at']);
                }
                break;
            // Agrega más casos para otros tipos de usuario si es necesario
            default:
                throw new \InvalidArgumentException('Tipo de usuario no válido: ' . $userType);
        }
        return $result;
    }
}