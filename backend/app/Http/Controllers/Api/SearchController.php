<?php
namespace App\Http\Controllers\Api;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

use App\Services\UserService;

class SearchController extends ApiCotroller
{
    public function searchByCI(SearchUserByCiRequest $request, UserService $userService): JsonResponse
    {
        // La validación ya fue manejada por el Form Request
        $ci = $request->validated('ci');
        $userType = $request->validated('type');

        try {
            $user = $userService->searchUserByCi($ci, $userType);

            if (!$user) {
                return $this->errorResponse('Usuario no encontrado', 404);
            }

            return $this->successResponse(
                // new UserResource($user), // Si usas un API Resource
                ['usuario' => $user], // Si devuelves el modelo directamente
                'Resultados de búsqueda obtenidos correctamente'
            );
        } catch (\InvalidArgumentException $e) {
            // Captura excepciones específicas del servicio si las hay
            return $this->errorResponse($e->getMessage(), 422);
        } catch (\Exception $e) {
            // Captura cualquier otra excepción inesperada
            return $this->errorResponse('Error en la búsqueda: ' . $e->getMessage(), 500);
        }
    }
}