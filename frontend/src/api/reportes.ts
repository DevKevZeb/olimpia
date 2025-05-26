import axiosInstance from './axiosInstance';

interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
}

interface Convocatoria {
    id: number;
    nombre: string;
    fecha_inicio_inscripcion: string;
    fecha_fin_inscripcion: string;
    max_areas_por_estudiante: number;
    estado: 'planificada' | 'abierta' | 'cerrada' | 'finalizada';
    created_at: string;
    updated_at: string;
}

export const obtenerTodasConvocatorias = async (): Promise<Convocatoria[] | null> => {
    try {
        const response = await axiosInstance.get<ApiResponse<Convocatoria[]>>('/v1/convocatorias');
        if (response.data.success && response.data.data) {
            return response.data.data;
        }
        return null;
    } catch (error: any) {
        console.error('Error al obtener las convocatorias:', error);
        alert('Error al obtener las convocatorias.');
        throw error;
    }
};

export const obtenerReportePorCampoId = async (campo: string, id: number  , params:any ): Promise<any | null> => {
    try {
        const response = await axiosInstance.get<ApiResponse>(`/v1/reportes/${campo}/${id}`,
           { 
            params:params
           }
        );
        if (response.data.success) {
            return response.data.data;
        }
        return null;
    } catch (error: any) {
        console.error(`Error al obtener reporte por ${campo} con ID ${id}:`, error);
        alert(`Error al obtener el reporte para ${campo} con ID ${id}.`);
        throw error;
    }
};