<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrdenPago extends Model
{
    use HasFactory;

    protected $table = 'ordenes_pago';
    protected $primaryKey = 'id_orden';
      protected $fillable = [
        'codigo_unico',
        'tipo_origen',
        'id_lista',
        'monto_total',
        'fecha_emision',
        'fecha_vencimiento',
        'estado',
    ];

    protected $casts = [
        'fecha_emision' => 'datetime',
        'fecha_vencimiento' => 'date',
    ];

    public function lista()
    {
        return $this->belongsTo(ListaInscripcion::class, 'id_lista');
    }

    public function comprobantes()
    {
        return $this->hasMany(ComprobantePago::class, 'id_orden');
    }
    public function getNombreResponsablePago(): ?string
    {
        if ($this->tipo_origen === 'lista' && $this->lista) {
            // Asegúrate de que ListaInscripcion tenga una relación con EncargadoPago
            // O que sepas de dónde sacar el nombre del responsable de la lista
            // Por ejemplo, si EncargadoPago está relacionado con ListaInscripcion
            $encargado = $this->lista->encargadoPago; // Asumiendo una relación 'encargadoPago' en ListaInscripcion
            return $encargado ? trim($encargado->nombres . ' ' . $encargado->apellidos) : null;
        } elseif ($this->tipo_origen === 'individual') {
            return $this->encargado_nombre; // O $this->encargado->nombre_completo si usas una relación
        }
        return null;
    }

    public function getVerificationDetails(): array
    {
        $response = [
            'id' => $this->id_orden,
            'codigo_unico' => $this->codigo_unico,
            'monto_total' => $this->monto_total,
            'fecha_emision' => $this->fecha_emision,
            'fecha_vencimiento' => $this->fecha_vencimiento,
            'estado' => $this->estado,
            'tipo_origen' => $this->tipo_origen,
        ];

        // Comprobación de si tiene comprobantes (asumiendo que 'comprobantes' es una relación hasMany)
        $response['tiene_comprobante'] = $this->comprobantes()->exists();

        if ($this->tipo_origen === 'individual' && $this->lista) {
            $primerDetalle = $this->lista->detalles()->with('estudiante')->first();
            if ($primerDetalle && $primerDetalle->estudiante) {
                $response['estudiante'] = [
                    'nombre_completo' => $primerDetalle->estudiante->nombres . ' ' . $primerDetalle->estudiante->apellidos,
                    'ci' => $primerDetalle->estudiante->ci,
                ];
            }
        } elseif ($this->tipo_origen === 'lista' && $this->lista) {
            if ($this->lista->unidadEducativa) { // Asegúrate de tener esta relación cargada o definida
                $response['unidad_educativa'] = $this->lista->unidadEducativa->nombre;
            }
            $response['estudiantes_count'] = $this->lista->detalles->count(); // Ya cargado si usas 'lista.detalles'
        }
        return $response;
    }

}