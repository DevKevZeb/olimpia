<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Inscripcion;
use App\Models\Competidor;
use App\Models\Tutor;
use App\Models\Area;
use App\Models\NivelCategoria;
use App\Models\Costo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class InscripcionController extends Controller
{
    public function index()
    {
        $inscripciones = Inscripcion::with(['competidor', 'tutor', 'area', 'nivel'])->get();
        return response()->json([
            'status' => 'success',
            'data' => $inscripciones
        ]);
    }
    
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'Id_competidor' => 'required|exists:Competidor,Id_competidor',
            'Id_tutor' => 'required|exists:Tutor,Id_tutor',
            'Id_area' => 'required|exists:Area,Id_area',
            'Id_nivel' => 'required|exists:NivelCategoria,Id_nivel',
            'estado' => 'sometimes|in:Pendiente,Pagado,Rechazado',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()
            ], 400);
        }
        
        // Verificar que exista un costo para la combinación de área y nivel
        $costo = Costo::where('Id_area', $request->Id_area)
                      ->where('Id_nivel', $request->Id_nivel)
                      ->first();
        
        if (!$costo) {
            return response()->json([
                'status' => 'error',
                'message' => 'No existe un costo definido para esta combinación de área y nivel'
            ], 400);
        }
        
        // Generar código único de inscripción
        $codigo = 'INS-' . strtoupper(Str::random(8));
        
        $inscripcion = new Inscripcion($request->all());
        $inscripcion->codigo = $codigo;
        $inscripcion->fecha = now();
        $inscripcion->estado = $request->input('estado', 'Pendiente');
        $inscripcion->boleta_generada = false;
        $inscripcion->save();
        
        return response()->json([
            'status' => 'success',
            'message' => 'Inscripción creada exitosamente',
            'data' => $inscripcion
        ], 201);
    }
    
    public function show($id)
    {
        $inscripcion = Inscripcion::with(['competidor', 'tutor', 'area', 'nivel', 'pagos'])->find($id);
        
        if (!$inscripcion) {
            return response()->json([
                'status' => 'error',
                'message' => 'Inscripción no encontrada'
            ], 404);
        }
        
        // Obtener el costo asociado
        $costo = Costo::where('Id_area', $inscripcion->Id_area)
                      ->where('Id_nivel', $inscripcion->Id_nivel)
                      ->first();
        
        $data = $inscripcion->toArray();
        $data['costo'] = $costo;
        
        return response()->json([
            'status' => 'success',
            'data' => $data
        ]);
    }
    
    public function update(Request $request, $id)
    {
        $inscripcion = Inscripcion::find($id);
        
        if (!$inscripcion) {
            return response()->json([
                'status' => 'error',
                'message' => 'Inscripción no encontrada'
            ], 404);
        }
        
        $validator = Validator::make($request->all(), [
            'Id_competidor' => 'sometimes|required|exists:Competidor,Id_competidor',
            'Id_tutor' => 'sometimes|required|exists:Tutor,Id_tutor',
            'Id_area' => 'sometimes|required|exists:Area,Id_area',
            'Id_nivel' => 'sometimes|required|exists:NivelCategoria,Id_nivel',
            'estado' => 'sometimes|in:Pendiente,Pagado,Rechazado',
            'boleta_generada' => 'sometimes|boolean'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()
            ], 400);
        }
        
        // Verificar que exista un costo si se cambia el área o nivel
        if ($request->has('Id_area') || $request->has('Id_nivel')) {
            $area_id = $request->input('Id_area', $inscripcion->Id_area);
            $nivel_id = $request->input('Id_nivel', $inscripcion->Id_nivel);
            
            $costo = Costo::where('Id_area', $area_id)
                          ->where('Id_nivel', $nivel_id)
                          ->first();
            
            if (!$costo) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No existe un costo definido para esta combinación de área y nivel'
                ], 400);
            }
        }
        
        $inscripcion->update($request->all());
        
        return response()->json([
            'status' => 'success',
            'message' => 'Inscripción actualizada exitosamente',
            'data' => $inscripcion
        ]);
    }
    
    public function destroy($id)
    {
        $inscripcion = Inscripcion::find($id);
        
        if (!$inscripcion) {
            return response()->json([
                'status' => 'error',
                'message' => 'Inscripción no encontrada'
            ], 404);
        }
        
        $inscripcion->delete();
        
        return response()->json([
            'status' => 'success',
            'message' => 'Inscripción eliminada exitosamente'
        ]);
    }
    
    public function getStats()
    {
        $totalInscripciones = Inscripcion::count();
        $inscripcionesPendientes = Inscripcion::where('estado', 'Pendiente')->count();
        $inscripcionesPagadas = Inscripcion::where('estado', 'Pagado')->count();
        $inscripcionesRechazadas = Inscripcion::where('estado', 'Rechazado')->count();
        
        $inscripcionesPorArea = DB::table('Inscripcion')
            ->join('Area', 'Inscripcion.Id_area', '=', 'Area.Id_area')
            ->select('Area.nombre', DB::raw('count(*) as total'))
            ->groupBy('Area.nombre')
            ->get();
            
        $inscripcionesPorNivel = DB::table('Inscripcion')
            ->join('NivelCategoria', 'Inscripcion.Id_nivel', '=', 'NivelCategoria.Id_nivel')
            ->select('NivelCategoria.nombre', DB::raw('count(*) as total'))
            ->groupBy('NivelCategoria.nombre')
            ->get();
            
        $totalCompetidores = Competidor::count();
        $totalTutores = Tutor::count();
        
        return response()->json([
            'status' => 'success',
            'data' => [
                'total_inscripciones' => $totalInscripciones,
                'inscripciones_pendientes' => $inscripcionesPendientes,
                'inscripciones_pagadas' => $inscripcionesPagadas,
                'inscripciones_rechazadas' => $inscripcionesRechazadas,
                'inscripciones_por_area' => $inscripcionesPorArea,
                'inscripciones_por_nivel' => $inscripcionesPorNivel,
                'total_competidores' => $totalCompetidores,
                'total_tutores' => $totalTutores
            ]
        ]);
    }
}
