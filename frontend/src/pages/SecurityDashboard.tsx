import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, Users, Eye, Clock, RefreshCw } from 'lucide-react';
import { apiService } from '../api/apiService';

interface LoginStatistics {
  last_24_hours: {
    total_attempts: number;
    successful_logins: number;
    failed_attempts: number;
    unique_ips: number;
  };
  last_7_days: {
    total_attempts: number;
    successful_logins: number;
    failed_attempts: number;
    unique_ips: number;
  };
  last_30_days: {
    total_attempts: number;
    successful_logins: number;
    failed_attempts: number;
    unique_ips: number;
  };
  blocked_ips: string[];
  recent_attempts: Array<{
    id: number;
    ip_address: string;
    email: string;
    successful: boolean;
    user_agent: string;
    created_at: string;
  }>;
  generated_at: string;
}

export default function SecurityDashboard() {
  const [statistics, setStatistics] = useState<LoginStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiService.get('/admin/login-statistics');
      
      if (response.success) {
        setStatistics(response.data);
        setLastRefresh(new Date());
      } else {
        setError('Error al cargar las estadísticas de seguridad');
      }
    } catch (err) {
      setError('Error de conexión al cargar las estadísticas');
      console.error('Error fetching security statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getSuccessRate = (successful: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((successful / total) * 100);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            Panel de Seguridad
          </h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-lg text-gray-600">Cargando estadísticas...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            Panel de Seguridad
          </h1>
          <button
            onClick={fetchStatistics}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="text-lg font-medium text-red-800">Error al cargar datos</h3>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!statistics) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Shield className="w-8 h-8 text-blue-600" />
          Panel de Seguridad
        </h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Última actualización: {formatDate(statistics.generated_at)}
          </div>
          <button
            onClick={fetchStatistics}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Blocked IPs Alert */}
      {statistics.blocked_ips.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            <div>
              <h3 className="text-lg font-medium text-orange-800">
                IPs Bloqueadas ({statistics.blocked_ips.length})
              </h3>
              <p className="text-orange-700">
                Las siguientes IPs están actualmente bloqueadas por intentos fallidos:
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {statistics.blocked_ips.map((ip, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-sm font-mono"
                  >
                    {ip}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 24 Hours */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Últimas 24 Horas</h3>
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total intentos:</span>
              <span className="font-semibold">{statistics.last_24_hours.total_attempts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Exitosos:</span>
              <span className="font-semibold text-green-600">{statistics.last_24_hours.successful_logins}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Fallidos:</span>
              <span className="font-semibold text-red-600">{statistics.last_24_hours.failed_attempts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">IPs únicas:</span>
              <span className="font-semibold">{statistics.last_24_hours.unique_ips}</span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between">
                <span className="text-gray-600">Tasa de éxito:</span>
                <span className={`font-semibold ${
                  getSuccessRate(statistics.last_24_hours.successful_logins, statistics.last_24_hours.total_attempts) >= 80
                    ? 'text-green-600' : getSuccessRate(statistics.last_24_hours.successful_logins, statistics.last_24_hours.total_attempts) >= 60
                    ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {getSuccessRate(statistics.last_24_hours.successful_logins, statistics.last_24_hours.total_attempts)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 7 Days */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Últimos 7 Días</h3>
            <Users className="w-6 h-6 text-green-600" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total intentos:</span>
              <span className="font-semibold">{statistics.last_7_days.total_attempts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Exitosos:</span>
              <span className="font-semibold text-green-600">{statistics.last_7_days.successful_logins}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Fallidos:</span>
              <span className="font-semibold text-red-600">{statistics.last_7_days.failed_attempts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">IPs únicas:</span>
              <span className="font-semibold">{statistics.last_7_days.unique_ips}</span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between">
                <span className="text-gray-600">Tasa de éxito:</span>
                <span className={`font-semibold ${
                  getSuccessRate(statistics.last_7_days.successful_logins, statistics.last_7_days.total_attempts) >= 80
                    ? 'text-green-600' : getSuccessRate(statistics.last_7_days.successful_logins, statistics.last_7_days.total_attempts) >= 60
                    ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {getSuccessRate(statistics.last_7_days.successful_logins, statistics.last_7_days.total_attempts)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 30 Days */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Últimos 30 Días</h3>
            <Eye className="w-6 h-6 text-purple-600" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total intentos:</span>
              <span className="font-semibold">{statistics.last_30_days.total_attempts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Exitosos:</span>
              <span className="font-semibold text-green-600">{statistics.last_30_days.successful_logins}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Fallidos:</span>
              <span className="font-semibold text-red-600">{statistics.last_30_days.failed_attempts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">IPs únicas:</span>
              <span className="font-semibold">{statistics.last_30_days.unique_ips}</span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between">
                <span className="text-gray-600">Tasa de éxito:</span>
                <span className={`font-semibold ${
                  getSuccessRate(statistics.last_30_days.successful_logins, statistics.last_30_days.total_attempts) >= 80
                    ? 'text-green-600' : getSuccessRate(statistics.last_30_days.successful_logins, statistics.last_30_days.total_attempts) >= 60
                    ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {getSuccessRate(statistics.last_30_days.successful_logins, statistics.last_30_days.total_attempts)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Attempts Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Intentos Recientes (Últimas 2 Horas)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha/Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User Agent
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {statistics.recent_attempts.length > 0 ? (
                statistics.recent_attempts.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(attempt.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {attempt.ip_address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {attempt.email || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {attempt.successful ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3" />
                          Exitoso
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <AlertTriangle className="w-3 h-3" />
                          Fallido
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {attempt.user_agent}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No hay intentos recientes en las últimas 2 horas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
