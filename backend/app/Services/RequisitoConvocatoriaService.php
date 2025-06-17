<?php
namespace App\Services;
use App\Models\Convocatoria;
use App\Models\RequisitoConvocatoria;
use Illuminate\Support\Facades\DB;

class RequisitoConvocatoriaService
{
    /**
     * Reemplaza todos los requisitos de una convocatoria con los nuevos datos.
     *
     * @param Convocatoria $convocatoria
     * @param array $requisitosData Array de arrays con los datos de los requisitos.
     * @return \Illuminate\Support\Collection Colección de los nuevos requisitos creados.
     * @throws \Exception
     */
    public function updateConvocatoriaRequirements(Convocatoria $convocatoria, array $requisitosData): \Illuminate\Support\Collection
    {
        return DB::transaction(function () use ($convocatoria, $requisitosData) {
            // Eliminar los requisitos existentes para esta convocatoria
            RequisitoConvocatoria::where('id_convocatoria', $convocatoria->id_convocatoria)->delete();

            $createdRequisitos = collect();
            // Crear los nuevos requisitos
            foreach ($requisitosData as $requisitoData) {
                $requisitoData['id_convocatoria'] = $convocatoria->id_convocatoria;
                $createdRequisitos->push(RequisitoConvocatoria::create($requisitoData));
            }
            return $createdRequisitos;
        });
    }
}