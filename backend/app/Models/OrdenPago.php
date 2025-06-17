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
        $baseOrdenData = [
            'id' => $this->id,
            'codigo_unico' => $this->codigo_unico,
            'monto_total' => $this->monto_total,
            'fecha_emision' => $this->fecha_emision ? $this->fecha_emision->toISOString() : null, // Asegura formato ISO
            'fecha_vencimiento' => $this->fecha_vencimiento ? $this->fecha_vencimiento->toISOString() : null, // Asegura formato ISO
            'estado' => $this->estado,
            'tipo_origen' => $this->tipo_origen,
            'tiene_comprobante' => $this->comprobantes->isNotEmpty(), // Esto ya lo haces
        ];

        // Inicializa el array de respuesta completo
        $responseData = [
            'orden' => $baseOrdenData, // Anidamos la orden bajo la clave 'orden'
        ];

        // Lógica condicional para agregar 'estudiante' o 'estudiantes_count'
        if ($this->tipo_origen === 'individual' && $this->lista && $this->lista->detalles->isNotEmpty()) {
            // Asumiendo que para una orden individual, hay un único detalle y estudiante
            $estudiante = $this->lista->detalles->first()->estudiante;
            if ($estudiante) {
                $responseData['estudiante'] = [
                    'nombre_completo' => $estudiante->nombre_completo, // Ajusta según tu modelo Estudiante
                    'ci' => $estudiante->ci, // Ajusta según tu modelo Estudiante
                ];
            }
        } elseif ($this->tipo_origen === 'lista' && $this->lista) {
            // Para una orden de lista, agrega el count
            $responseData['estudiantes_count'] = $this->lista->detalles->count();
        }

        // Agregar la unidad_educativa, que ahora viene del primer estudiante de la lista
        // (ya la tienes cargada gracias a 'lista.detalles.estudiante.unidadEducativa')
        if ($this->lista && $this->lista->getUnidadEducativaAttribute()) { // Usa el accessor
            $responseData['unidad_educativa'] = $this->lista->getUnidadEducativaAttribute()->nombre; // Asume que la UnidadEducativa tiene un 'nombre'
        }

        return $responseData;
    }

}