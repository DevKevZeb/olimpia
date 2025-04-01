import { apiService } from './api';
import { API_ROUTES } from '../config';
import { 
  PaymentOrder, 
  PaymentReceipt, 
  ApiResponse, 
  PaginationResponse 
} from '../types';

/**
 * Servicio para gestionar órdenes de pago y comprobantes
 */
export const pagoService = {
  /**
   * Obtener órdenes de pago con paginación y filtros opcionales
   */
  async getOrdenesPago(page = 1, estado?: string, tipoOrigen?: 'individual' | 'lista'): Promise<ApiResponse<PaginationResponse<PaymentOrder>>> {
    try {
      let url = `${API_ROUTES.ORDENES_PAGO}?page=${page}`;
      
      if (estado) {
        url += `&estado=${estado}`;
      }
      
      if (tipoOrigen) {
        url += `&tipo_origen=${tipoOrigen}`;
      }
      
      return await apiService.get(url);
    } catch (error) {
      console.error("Error fetching órdenes de pago:", error);
      throw error;
    }
  },

  /**
   * Obtener una orden de pago por su ID
   */
  async getOrdenPago(id: string): Promise<ApiResponse<PaymentOrder>> {
    try {
      return await apiService.get(`${API_ROUTES.ORDENES_PAGO}/${id}`);
    } catch (error) {
      console.error(`Error fetching orden de pago ${id}:`, error);
      throw error;
    }
  },

  /**
   * Obtener una orden de pago por su código único
   */
  async getOrdenPagoByCodigo(codigo: string): Promise<ApiResponse<PaymentOrder>> {
    try {
      return await apiService.get(`${API_ROUTES.ORDENES_PAGO_BUSCAR}?codigo=${encodeURIComponent(codigo)}`);
    } catch (error) {
      console.error(`Error fetching orden de pago with código ${codigo}:`, error);
      throw error;
    }
  },

  /**
   * Crear una nueva orden de pago
   */
  async createOrdenPago(orden: Partial<PaymentOrder>): Promise<ApiResponse<PaymentOrder>> {
    try {
      return await apiService.post(API_ROUTES.ORDENES_PAGO, {
        tipo_origen: orden.sourceType,
        id_inscripcion: orden.registrationId,
        id_lista: orden.listId,
        fecha_vencimiento: orden.dueDate
      });
    } catch (error) {
      console.error("Error creating orden de pago:", error);
      throw error;
    }
  },

  /**
   * Actualizar una orden de pago
   */
  async updateOrdenPago(id: string, orden: Partial<PaymentOrder>): Promise<ApiResponse<PaymentOrder>> {
    try {
      const updateData: any = {};
      
      if (orden.dueDate) updateData.fecha_vencimiento = orden.dueDate;
      if (orden.status) updateData.estado = this.mapStatusToBackend(orden.status);
      
      return await apiService.put(`${API_ROUTES.ORDENES_PAGO}/${id}`, updateData);
    } catch (error) {
      console.error(`Error updating orden de pago ${id}:`, error);
      throw error;
    }
  },

  /**
   * Eliminar una orden de pago
   */
  async deleteOrdenPago(id: string): Promise<ApiResponse<null>> {
    try {
      return await apiService.delete(`${API_ROUTES.ORDENES_PAGO}/${id}`);
    } catch (error) {
      console.error(`Error deleting orden de pago ${id}:`, error);
      throw error;
    }
  },

  /**
   * Obtener comprobantes de pago por orden
   */
  async getComprobantesByOrden(ordenId: string): Promise<ApiResponse<PaymentReceipt[]>> {
    try {
      return await apiService.get(`${API_ROUTES.COMPROBANTES_PAGO}?orden_id=${ordenId}`);
    } catch (error) {
      console.error(`Error fetching comprobantes for orden ${ordenId}:`, error);
      throw error;
    }
  },

  /**
   * Subir un comprobante de pago
   */
  async uploadComprobante(comprobante: Partial<PaymentReceipt>, pdfFile: File): Promise<ApiResponse<PaymentReceipt>> {
    try {
      const formData = new FormData();
      formData.append('id_orden', comprobante.orderId as string);
      formData.append('numero_comprobante', comprobante.receiptNumber as string);
      formData.append('nombre_pagador', comprobante.payerName as string);
      formData.append('fecha_pago', comprobante.paymentDate as string);
      formData.append('monto_pagado', comprobante.amountPaid?.toString() || '0');
      formData.append('pdf_comprobante', pdfFile);

      return await apiService.post(API_ROUTES.COMPROBANTES_PAGO, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    } catch (error) {
      console.error("Error uploading comprobante:", error);
      throw error;
    }
  },

  /**
   * Verificar un comprobante de pago
   */
  async verifyComprobante(id: string, isVerified: boolean): Promise<ApiResponse<PaymentReceipt>> {
    try {
      return await apiService.put(`${API_ROUTES.COMPROBANTES_PAGO}/${id}`, {
        estado_verificacion: isVerified ? 'verificado' : 'rechazado'
      });
    } catch (error) {
      console.error(`Error verifying comprobante ${id}:`, error);
      throw error;
    }
  },

  /**
   * Obtener la URL de descarga de un comprobante
   */
  async getComprobantePdfUrl(id: string): Promise<string> {
    try {
      const response = await apiService.get(`${API_ROUTES.COMPROBANTES_PAGO}/${id}/download`);
      return response.data.url;
    } catch (error) {
      console.error(`Error getting comprobante PDF URL for ${id}:`, error);
      throw error;
    }
  },

  /**
   * Mapear estado de orden de pago al formato del backend
   */
  mapStatusToBackend(status?: 'pending' | 'paid' | 'expired'): string {
    switch (status) {
      case 'pending': return 'pendiente';
      case 'paid': return 'pagada';
      case 'expired': return 'vencida';
      default: return 'pendiente';
    }
  },

  /**
   * Mapear estado del backend al formato del frontend
   */
  mapStatusFromBackend(estado?: string): 'pending' | 'paid' | 'expired' {
    switch (estado) {
      case 'pendiente': return 'pending';
      case 'pagada': return 'paid';
      case 'vencida': return 'expired';
      default: return 'pending';
    }
  }
};
