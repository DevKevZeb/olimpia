<?php

namespace App\Exceptions;

use Exception;

/**
 * El comprobante de pago no se pudo leer o no coincide con la orden.
 * Su mensaje está pensado para mostrarse al usuario.
 */
class ComprobanteRechazadoException extends Exception
{
}
