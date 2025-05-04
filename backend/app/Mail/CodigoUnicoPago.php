<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class CodigoUnicoPago extends Mailable
{
    use Queueable, SerializesModels;

    public $codigoUnico;
    public $nombresEncargado;

    /**
     * Create a new message instance.
     *
     * @param  string  $codigoUnico
     * @param  string  $nombresEncargado
     * @return void
     */
    public function __construct(string $codigoUnico, string $nombresEncargado)
    {
        $this->codigoUnico = $codigoUnico;
        $this->nombresEncargado = $nombresEncargado;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        return $this->subject('Tu Código Único de Pago')
                    ->view('emails.codigo-unico-pago')
                    ->with([
                        'codigoUnico' => $this->codigoUnico,
                        'nombresEncargado' => $this->nombresEncargado,
                    ]);
    }
}