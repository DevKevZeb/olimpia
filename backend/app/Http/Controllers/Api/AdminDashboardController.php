<?php

namespace App\Http\Controllers\Api;

use App\Services\AdminDashboardService;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends ApiController
{
    /**
     * Obtiene estadísticas y datos para el dashboard administrativo
     */
    public function index(AdminDashboardService $dashboardService): JsonResponse
    {
        return $this->successResponse(
            $dashboardService->getDashboardData(),
            'Datos del dashboard obtenidos correctamente'
        );
    }
}
