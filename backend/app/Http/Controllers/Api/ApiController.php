<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class ApiController extends Controller
{
    /**
     * Success Response
     *
     * @param mixed $data
     * @param string $message
     * @param int $code
     * @return JsonResponse
     */
    protected function successResponse($data, string $message = 'Operación exitosa', int $code = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data
        ], $code);
    }

    /**
     * Return error response
     */
    public function errorResponse(string $message = null, int $code = 400, $errors = null): JsonResponse
    {
        $response = [
            'status' => 'Error',
            'message' => $message,
            'data' => null
        ];

        if ($code === 422 && $errors) {
            $response['errors'] = $errors;
        } elseif ($errors) {
            $response['data'] = $errors; // Para otros tipos de errores, podrías incluir detalles en 'data' si lo deseas
        }

        return response()->json($response, $code);
    }
}