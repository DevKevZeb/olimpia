<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Pago;
use App\Models\Inscripcion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class PagoController extends Controller
{
    public function index()
    {
        $pagos = Pago::with('inscripcion')->get();
        return response()->json([
            'status' => 'success',
            'data' => $pagos
        ]);
    }
    
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'Id_inscripcion' => 'required|exists:Inscripcion,Id_inscripcion',
            'monto' => 'required|numeric|min:0',
            'numero_comprobante' => 'required|string|max:100',
            'nombre_pagador' => 'required|string|max:100',
            'archivo_comprobante' => 'required|string'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()
            ], 400);
        }
        
        // Verificar que la inscripción exista y no esté ya pagada
        $inscripcion = Inscripcion::find($request->Id_inscripcion);
        if (!$inscripcion) {
            return response()->json([
                'status' => 'error',
                'message' => 'Inscripción no encontrada'
            ], 404);
        }
        
        if ($inscripcion->estado === 'Pagado') {
            return response()->json([
                'status' => 'error',
                'message' => 'Esta inscripción ya ha sido pagada'
            ], 400);
        }
        
        // Crear el pago
        $pago = new Pago($request->all());
        $pago->fecha_pago = now();
        $pago->save();
        
        // Actualizar estado de inscripción
        $inscripcion->estado = 'Pagado';
        $inscripcion->save();
        
        return response()->json([
            'status' => 'success',
            'message' => 'Pago registrado exitosamente',
            'data' => $pago
        ], 201);
    }
    
    public function show($id)
    {
        $pago = Pago::with('inscripcion')->find($id);
        
        if (!$pago) {
            return response()->json([
                'status' => 'error',
                'message' => 'Pago no encontrado'
            ], 404);
        }
        
        return response()->json([
            'status' => 'success',
            'data' => $pago
        ]);
    }
    
    public function update(Request $request, $id)
    {
        $pago = Pago::find($id);
        
        if (!$pago) {
            return response()->json([
                'status' => 'error',
                'message' => 'Pago no encontrado'
            ], 404);
        }
        
        $validator = Validator::make($request->all(), [
            'monto' => 'sometimes|required|numeric|min:0',
            'numero_comprobante' => 'sometimes|required|string|max:100',
            'nombre_pagador' => 'sometimes|required|string|max:100',
            'archivo_comprobante' => 'sometimes|required|string'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()
            ], 400);
        }
        
        $pago->update($request->all());
        
        return response()->json([
            'status' => 'success',
            'message' => 'Pago actualizado exitosamente',
            'data' => $pago
        ]);
    }
    
    public function destroy($id)
    {
        $pago = Pago::find($id);
        
        if (!$pago) {
            return response()->json([
                'status' => 'error',
                'message' => 'Pago no encontrado'
            ], 404);
        }
        
        // Obtener la inscripción asociada
        $inscripcion = Inscripcion::find($pago->Id_inscripcion);
        
        // Eliminar el pago
        $pago->delete();
        
        // Actualizar el estado de la inscripción si existe
        if ($inscripcion) {
            $inscripcion->estado = 'Pendiente';
            $inscripcion->save();
        }
        
        return response()->json([
            'status' => 'success',
            'message' => 'Pago eliminado exitosamente'
        ]);
    }
}
