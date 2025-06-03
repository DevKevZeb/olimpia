<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class LoginAttempt extends Model
{
    use HasFactory;

    protected $fillable = [
        'ip_address',
        'email',
        'successful',
        'user_agent',
    ];

    protected $casts = [
        'successful' => 'boolean',
    ];

    /**
     * Registrar un intento de login
     */
    public static function recordAttempt(string $ipAddress, string $email = null, bool $successful = false, string $userAgent = null)
    {
        return static::create([
            'ip_address' => $ipAddress,
            'email' => $email,
            'successful' => $successful,
            'user_agent' => $userAgent,
        ]);
    }

    /**
     * Verificar si una IP está bloqueada por demasiados intentos fallidos
     */
    public static function isBlocked(string $ipAddress, int $maxAttempts = 5, int $timeWindowMinutes = 15): bool
    {
        $failedAttempts = static::where('ip_address', $ipAddress)
            ->where('successful', false)
            ->where('created_at', '>=', Carbon::now()->subMinutes($timeWindowMinutes))
            ->count();

        return $failedAttempts >= $maxAttempts;
    }

    /**
     * Limpiar intentos antiguos
     */
    public static function clearOldAttempts(int $daysOld = 7)
    {
        return static::where('created_at', '<', Carbon::now()->subDays($daysOld))->delete();
    }
}
