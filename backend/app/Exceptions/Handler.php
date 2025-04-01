<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * A list of the exception types that are not reported.
     *
     * @var array<int, class-string<Throwable>>
     */
    protected $dontReport = [
        //
    ];

    /**
     * A list of the inputs that are never flashed for validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     *
     * @return void
     */
    public function register()
    {
        $this->reportable(function (Throwable $e) {
            //
        });

        $this->renderable(function (Throwable $e, $request) {
            if ($request->is('api/*')) {
                return $this->handleApiException($request, $e);
            }
        });
    }

    /**
     * Handle API exceptions better
     */
    private function handleApiException($request, Throwable $exception)
    {
        if ($exception instanceof AuthenticationException) {
            return response()->json([
                'status' => 'Error',
                'message' => 'Unauthenticated or token expired',
                'data' => null
            ], 401);
        }

        if ($exception instanceof ValidationException) {
            return response()->json([
                'status' => 'Error',
                'message' => $exception->validator->errors()->first(),
                'data' => null,
                'errors' => $exception->validator->errors()
            ], 422);
        }

        if ($exception instanceof ModelNotFoundException) {
            $modelName = strtolower(class_basename($exception->getModel()));
            return response()->json([
                'status' => 'Error',
                'message' => "No se encontró el {$modelName} especificado",
                'data' => null
            ], 404);
        }

        if ($exception instanceof NotFoundHttpException) {
            return response()->json([
                'status' => 'Error',
                'message' => 'La URL especificada no existe',
                'data' => null
            ], 404);
        }

        if ($exception instanceof MethodNotAllowedHttpException) {
            return response()->json([
                'status' => 'Error',
                'message' => 'El método especificado no está permitido para esta ruta',
                'data' => null
            ], 405);
        }

        // Default error response
        return response()->json([
            'status' => 'Error',
            'message' => $exception->getMessage(),
            'data' => null
        ], 500);
    }
}
