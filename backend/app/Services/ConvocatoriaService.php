<?php

namespace App\Services;

use App\Models\Convocatoria;
use App\Repositories\ConvocatoriaRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ConvocatoriaService
{
    private $convocatoriaRepository;

    public function __construct(ConvocatoriaRepository $convocatoriaRepository)
    {
        $this->convocatoriaRepository = $convocatoriaRepository;
    }

    /**
     * Crea una nueva convocatoria
     */
    public function crearConvocatoria(array $datos): Convocatoria
    {
        try {
            // Forzar estado inicial como "planificada"
            $datos['estado'] = 'planificada';
            
            $convocatoria = Convocatoria::create($datos);
            
            if (!$convocatoria || !$convocatoria->id_convocatoria) {
                throw new \Exception('No se pudo crear la convocatoria correctamente');
            }
            
            Log::info('Convocatoria creada exitosamente', ['id' => $convocatoria->id_convocatoria]);
            
            return $convocatoria;
        } catch (\Exception $e) {
            Log::error('Error al crear convocatoria', ['error' => $e->getMessage(), 'datos' => $datos]);
            throw $e;
        }
    }

    /**
     * Obtiene convocatorias por estado
     */
    public function obtenerPorEstado(array $estados): \Illuminate\Database\Eloquent\Collection
    {
        return $this->convocatoriaRepository->obtenerPorEstados($estados);
    }

    /**
     * Obtiene todas las convocatorias ordenadas por fecha
     */
    public function obtenerTodas(): \Illuminate\Database\Eloquent\Collection
    {
        return $this->convocatoriaRepository->obtenerTodasOrdenadas();
    }

    /**
     * Obtiene convocatorias activas (planificadas y abiertas)
     */
    public function obtenerActivas(): \Illuminate\Database\Eloquent\Collection
    {
        return $this->obtenerPorEstado(['planificada', 'abierta']);
    }

    /**
     * Obtiene solo convocatorias planificadas
     */
    public function obtenerPlanificadas(): \Illuminate\Database\Eloquent\Collection
    {
        return $this->obtenerPorEstado(['planificada']);
    }

    /**
     * Encuentra una convocatoria por ID
     */
    public function encontrarPorId(int $id): ?Convocatoria
    {
        return $this->convocatoriaRepository->encontrarPorId($id);
    }

    /**
     * Encuentra una convocatoria por ID o lanza excepción
     */
    public function encontrarPorIdOFallar(int $id): Convocatoria
    {
        $convocatoria = $this->encontrarPorId($id);
        
        if (!$convocatoria) {
            throw new \Exception('Convocatoria no encontrada');
        }
        
        return $convocatoria;
    }
}
