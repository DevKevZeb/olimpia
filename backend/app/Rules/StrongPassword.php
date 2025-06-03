<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;

class StrongPassword implements Rule
{
    /**
     * Create a new rule instance.
     *
     * @return void
     */
    public function __construct()
    {
        //
    }

    /**
     * Determine if the validation rule passes.
     *
     * @param  string  $attribute
     * @param  mixed  $value
     * @return bool
     */
    public function passes($attribute, $value)
    {
        // Verificar que tenga al menos 8 caracteres
        if (strlen($value) < 8) {
            return false;
        }

        // Verificar que tenga al menos una letra minúscula
        if (!preg_match('/[a-z]/', $value)) {
            return false;
        }

        // Verificar que tenga al menos una letra mayúscula
        if (!preg_match('/[A-Z]/', $value)) {
            return false;
        }

        // Verificar que tenga al menos un número
        if (!preg_match('/[0-9]/', $value)) {
            return false;
        }

        // Verificar que tenga al menos un carácter especial
        if (!preg_match('/[!@#$%^&*(),.?":{}|<>]/', $value)) {
            return false;
        }

        return true;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return 'La contraseña debe tener al menos 8 caracteres, incluyendo mayúsculas, minúsculas, números y símbolos especiales.';
    }
}
