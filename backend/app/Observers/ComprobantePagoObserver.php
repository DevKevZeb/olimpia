<?php

namespace App\Observers;

use App\Models\ComprobantePago;
use App\Models\Inscripcion;

class ComprobantePagoObserver
{
    public function updated(ComprobantePago $comprobante)
    {
        if ($comprobante->isDirty('estado_verificacion') && 
            $comprobante->estado_verificacion === 'verificado') {
            
            $orden = $comprobante->orden;
            
            // Para órdenes individuales
            if ($orden->tipo_origen === 'individual' && $orden->inscripcion) {
                $orden->inscripcion->update(['estado' => 'verificada']);
            }
            
            // Para órdenes grupales
            if ($orden->tipo_origen === 'lista' && $orden->lista) {
                $inscripcionesIds = $orden->lista->detalles()
                    ->with('estudiante.inscripciones')
                    ->get()
                    ->flatMap(function($detalle) use ($orden) {
                        return $detalle->estudiante->inscripciones()
                            ->where('id_convocatoria_area', $detalle->id_convocatoria_area)
                            ->pluck('id_inscripcion');
                    });
                
                Inscripcion::whereIn('id_inscripcion', $inscripcionesIds)
                    ->update(['estado' => 'verificada']);
            }
        }
    }
}