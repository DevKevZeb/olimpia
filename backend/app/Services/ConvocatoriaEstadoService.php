<?php

namespace App\Services;

use App\Models\Convocatoria;
use Illuminate\Support\Facades\Log;

class ConvocatoriaEstadoService
{
    /**
     * Obtiene el estado completo de una convocatoria
     */
    public function obtenerEstadoCompleto(Convocatoria $convocatoria): array
    {
        $requisitos = $convocatoria->obtenerRequisitosApertura();
        $puedeAbrir = $convocatoria->puedeAbrirse();
        $debeCerrar = $convocatoria->debeSerCerrada();

        return [
            'estado_actual' => $convocatoria->estado,
            'puede_abrir' => $puedeAbrir,
            'debe_cerrar' => $debeCerrar,
            'fecha_apertura' => $convocatoria->fecha_apertura,
            'requisitos' => $requisitos,
            'transiciones_validas' => $this->obtenerTransicionesValidas($convocatoria->estado)
        ];
    }

    /**
     * Realiza la transición de estado de una convocatoria
     */
    public function transicionarEstado(Convocatoria $convocatoria, string $nuevoEstado): array
    {
        try {
            Log::info('Intentando transicionar estado de convocatoria', [
                'convocatoria_id' => $convocatoria->id_convocatoria,
                'estado_actual' => $convocatoria->estado,
                'nuevo_estado' => $nuevoEstado
            ]);

            $resultado = $convocatoria->transicionarEstado($nuevoEstado);

            if ($resultado['success']) {
                Log::info('Transición de estado exitosa', [
                    'convocatoria_id' => $convocatoria->id_convocatoria,
                    'estado_nuevo' => $convocatoria->estado
                ]);
            } else {
                Log::warning('Transición de estado fallida', [
                    'convocatoria_id' => $convocatoria->id_convocatoria,
                    'razon' => $resultado['message']
                ]);
            }

            return $resultado;
        } catch (\Exception $e) {
            Log::error('Error en transición de estado', [
                'convocatoria_id' => $convocatoria->id_convocatoria,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Cierra convocatorias expiradas automáticamente
     */
    public function cerrarConvocatoriasExpiradas(): array
    {
        $convocatorias = Convocatoria::paraCerrarAutomaticamente()->get();
        $cerradas = 0;
        $errores = [];

        foreach ($convocatorias as $convocatoria) {
            try {
                $resultado = $this->transicionarEstado($convocatoria, 'cerrada');
                if ($resultado['success']) {
                    $cerradas++;
                }
            } catch (\Exception $e) {
                $errores[] = [
                    'convocatoria_id' => $convocatoria->id_convocatoria,
                    'error' => $e->getMessage()
                ];
            }
        }

        Log::info('Proceso de cierre automático completado', [
            'total_verificadas' => $convocatorias->count(),
            'cerradas' => $cerradas,
            'errores' => count($errores)
        ]);

        return [
            'convocatorias_cerradas' => $cerradas,
            'total_verificadas' => $convocatorias->count(),
            'errores' => $errores
        ];
    }

    /**
     * Obtiene las transiciones válidas para un estado dado
     */
    public function obtenerTransicionesValidas(string $estado): array
    {
        $transiciones = [
            'planificada' => [
                ['estado' => 'abierta', 'label' => 'Abrir Convocatoria', 'requiere_validacion' => true]
            ],
            'abierta' => [
                // No hay transiciones manuales desde abierta
                // El cierre es automático cuando pasa la fecha
            ],
            'cerrada' => [
                ['estado' => 'finalizada', 'label' => 'Finalizar Convocatoria', 'requiere_validacion' => false]
            ],
            'finalizada' => []
        ];

        return $transiciones[$estado] ?? [];
    }
}
