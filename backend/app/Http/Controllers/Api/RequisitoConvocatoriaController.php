<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Convocatoria;
use App\Models\RequisitoConvocatoria;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RequisitoConvocatoriaController extends Controller
{
    /**
     * Display a listing of the requisitos for a specific convocatoria.
     *
     * @param  \App\Models\Convocatoria  $convocatoria
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Convocatoria $convocatoria)
    {
        $requisitos = RequisitoConvocatoria::where('id_convocatoria', $convocatoria->id_convocatoria)->get();
        return response()->json($requisitos);
    }

    /**
     * Store a newly created requisitos for a specific convocatoria in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Convocatoria  $convocatoria
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request, Convocatoria $convocatoria)
    {
        $validator = Validator::make($request->all(), [
            '*.entidad' => 'required|string|max:255',
            '*.campo' => 'required|string|max:255',
            '*.es_obligatorio' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Eliminar los requisitos existentes para esta convocatoria
        RequisitoConvocatoria::where('id_convocatoria', $convocatoria->id_convocatoria)->delete();

        // Crear los nuevos requisitos
        foreach ($request->all() as $requisitoData) {
            $requisitoData['id_convocatoria'] = $convocatoria->id_convocatoria;
            RequisitoConvocatoria::create($requisitoData);
        }

        return response()->json(['message' => 'Requisitos configurados exitosamente'], 201);
    }

    /**
     * Display the specified resource.
     *
     * @param  \App\Models\RequisitoConvocatoria  $requisitoConvocatoria
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(RequisitoConvocatoria $requisitoConvocatoria)
    {
        return response()->json($requisitoConvocatoria);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\RequisitoConvocatoria  $requisitoConvocatoria
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, RequisitoConvocatoria $requisitoConvocatoria)
    {
        $validator = Validator::make($request->all(), [
            'id_convocatoria' => 'required|exists:convocatorias,id_convocatoria',
            'entidad' => 'required|string|max:255',
            'campo' => 'required|string|max:255',
            'es_obligatorio' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $requisitoConvocatoria->update($request->all());
        return response()->json(['message' => 'Requisito actualizado exitosamente']);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Models\RequisitoConvocatoria  $requisitoConvocatoria
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(RequisitoConvocatoria $requisitoConvocatoria)
    {
        $requisitoConvocatoria->delete();
        return response()->json(['message' => 'Requisito eliminado exitosamente']);
    }
}