<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Carbon\Carbon;

class Convocatoria extends Model
{
    use HasFactory;

    protected $primaryKey = 'id_convocatoria';
    protected $table = 'convocatorias';    protected $fillable = [
        'nombre',
        'fecha_inicio_inscripcion',
        'fecha_fin_inscripcion',
        'max_areas_por_estudiante',
        'estado',
        'fecha_apertura'
    ];

    protected $casts = [
        'fecha_inicio_inscripcion' => 'date',
        'fecha_fin_inscripcion' => 'date',
        'fecha_apertura' => 'datetime',
    ];

    public function areas()
    {
        return $this->hasMany(ConvocatoriaArea::class, 'id_convocatoria');
    }    public function niveles()
    {
        return $this->hasManyThrough(
            ConvocatoriaNivel::class,
            ConvocatoriaArea::class,
            'id_convocatoria', // FK en convocatoria_areas
            'id_convocatoria_area', // FK en convocatoria_niveles
            'id_convocatoria', // PK en convocatorias
            'id_convocatoria_area' // PK en convocatoria_areas
        );
    }    // Replaced inscripciones() relationship since Inscripcion model was deleted
    // All registrations now go through detalles_lista_inscripcion
    public function detallesInscripcion()
    {
        return $this->hasManyThrough(
            DetalleListaInscripcion::class,
            ConvocatoriaNivel::class,
            'id_convocatoria_area', // FK en convocatoria_niveles que se relaciona con convocatoria_areas
            'id_convocatoria_nivel', // FK en detalles_lista_inscripcion
            'id_convocatoria', // PK en convocatorias
            'id_convocatoria_nivel' // PK en convocatoria_niveles
        );
    }

    /**
     * Verifica si la convocatoria puede ser abierta
     * Requisitos: áreas asignadas, niveles configurados, costos establecidos
     */
    public function puedeAbrirse(): bool
    {
        $requisitos = $this->obtenerRequisitosApertura();
        return $requisitos['areas_asignadas'] && 
               $requisitos['niveles_configurados'] && 
               $requisitos['costos_establecidos'];
    }

    /**
     * Obtiene el estado de los requisitos para abrir la convocatoria
     */
    public function obtenerRequisitosApertura(): array
    {
        // Verificar áreas asignadas
        $areasAsignadas = $this->areas()->count() > 0;

        // Verificar niveles configurados
        $nivelesConfigurados = $this->niveles()->count() > 0;        // Verificar costos establecidos
        // Debe tener áreas asignadas Y todas deben tener costo > 0
        $totalAreas = $this->areas()->count();
        $areasConCosto = $this->areas()->where('costo_inscripcion', '>', 0)->count();
        $costosEstablecidos = $totalAreas > 0 && $areasConCosto === $totalAreas;

        return [
            'areas_asignadas' => $areasAsignadas,
            'niveles_configurados' => $nivelesConfigurados,
            'costos_establecidos' => $costosEstablecidos,
            'requisitos_faltantes' => $this->obtenerRequisitosFaltantes($areasAsignadas, $nivelesConfigurados, $costosEstablecidos)
        ];
    }

    /**
     * Obtiene la lista de requisitos faltantes
     */
    private function obtenerRequisitosFaltantes(bool $areas, bool $niveles, bool $costos): array
    {
        $faltantes = [];
        
        if (!$areas) {
            $faltantes[] = 'Debe asignar al menos un área de competencia';
        }
        
        if (!$niveles) {
            $faltantes[] = 'Debe configurar niveles y grados para las áreas';
        }
        
        if (!$costos) {
            $faltantes[] = 'Debe establecer costos de inscripción mayores a 0';
        }

        return $faltantes;
    }

    /**
     * Verifica si la convocatoria debe cerrarse automáticamente
     */
    public function debeSerCerrada(): bool
    {
        if ($this->estado !== 'abierta') {
            return false;
        }

        return now()->isAfter($this->fecha_fin_inscripcion);
    }

    /**
     * Verifica si una transición de estado es válida
     */
    public function puedeTransicionarA(string $nuevoEstado): bool
    {
        $estadoActual = $this->estado;

        // Matriz de transiciones válidas
        $transicionesValidas = [
            'planificada' => ['abierta'],
            'abierta' => ['cerrada'],
            'cerrada' => ['finalizada'],
            'finalizada' => [] // Estado final
        ];

        return in_array($nuevoEstado, $transicionesValidas[$estadoActual] ?? []);
    }

    /**
     * Transiciona el estado con validaciones
     */
    public function transicionarEstado(string $nuevoEstado): array
    {
        // Verificar si la transición es válida
        if (!$this->puedeTransicionarA($nuevoEstado)) {
            return [
                'success' => false,
                'message' => "No se puede cambiar de '{$this->estado}' a '{$nuevoEstado}'"
            ];
        }

        // Validaciones específicas para abrir
        if ($nuevoEstado === 'abierta' && !$this->puedeAbrirse()) {
            $requisitos = $this->obtenerRequisitosApertura();
            return [
                'success' => false,
                'message' => 'No se cumplen los requisitos para abrir la convocatoria',
                'requisitos_faltantes' => $requisitos['requisitos_faltantes']
            ];
        }        // Aplicar la transición
        $this->estado = $nuevoEstado;
        
        // Si se está abriendo la convocatoria, guardar la fecha de apertura
        if ($nuevoEstado === 'abierta') {
            $this->fecha_apertura = now();
        }
        
        $this->save();

        return [
            'success' => true,
            'message' => "Estado actualizado a '{$nuevoEstado}' exitosamente"
        ];
    }

    /**
     * Scope para obtener convocatorias que deben ser cerradas
     */
    public function scopeParaCerrarAutomaticamente($query)
    {
        return $query->where('estado', 'abierta')
                    ->where('fecha_fin_inscripcion', '<', now());
    }
    public function scopeActiva(Builder $query): Builder
    {
        return $query->where('estado', 'abierta')
                     ->where('fecha_inicio_inscripcion', '<=', now())
                     ->where('fecha_fin_inscripcion', '>=', now());
    }
    public function scopeCurrentOrPlanned(Builder $query): Builder
    {
        return $query->where('estado', 'abierta')
                     ->orWhere('estado', 'planificada')
                     ->latest(); // Obtiene la más reciente si hay varias
    }
    public function getTotalInscritosAttribute(): int
    {
        // Lógica actualizada para usar DetalleListaInscripcion, si 'Inscripcion' fue eliminado.
        return DetalleListaInscripcion::whereHas('convocatoriaNivel.convocatoriaArea', function($query) {
            $query->where('id_convocatoria', $this->id_convocatoria);
        })->count();
        // Si 'Inscripcion' aún existe y se usa así:
        // return \App\Models\Inscripcion::whereHas('convocatoriaArea', function($query) {
        //     $query->where('id_convocatoria', $this->id_convocatoria);
        // })->count();
    }
    public function getDiasRestantesAttribute(): int
    {
        $hoy = Carbon::now();
        $fechaFin = Carbon::parse($this->fecha_fin_inscripcion);

        if ($fechaFin->isPast()) {
            return 0;
        }

        return $hoy->diffInDays($fechaFin);
    }
}