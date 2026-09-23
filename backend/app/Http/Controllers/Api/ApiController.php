<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Throwable;

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
            $response['data'] = $errors;
        }

        return response()->json($response, $code);
    }

    /**
     * Registra la excepción y responde con un mensaje genérico (404 si el recurso no existe).
     * El detalle técnico solo se expone con APP_DEBUG activo.
     */
    protected function serverErrorResponse(string $message, Throwable $e, int $code = 500): JsonResponse
    {
        if ($e instanceof ModelNotFoundException) {
            return $this->errorResponse($e->getMessage() ?: 'Recurso no encontrado', 404);
        }

        Log::error($message, ['exception' => $e]);

        $detail = config('app.debug') ? ['exception' => $e->getMessage()] : null;

        return $this->errorResponse($message, $code, $detail);
    }
}