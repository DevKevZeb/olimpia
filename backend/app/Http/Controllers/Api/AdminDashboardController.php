 <?php

namespace App\Http\Controllers\Api;

use App\Models\AdminDashboard;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends ApiController
{
    /**
     * Obtiene estadísticas y datos para el dashboard administrativo
     * 
     * @return JsonResponse
     */
    public function index()
    {
        return AdminDashboard::getDashBoardData();
    }
}
