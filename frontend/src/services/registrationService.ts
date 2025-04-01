import { apiService } from './api';
import { API_ROUTES } from '../config';
import { 
  Registration, 
  RegistrationList, 
  RegistrationListDetail,
  PaymentOrder,
  PaymentReceipt,
  PaginationResponse,
  Guardian
} from '../types';

export const registrationService = {
  // Crear tutor legal
  async createGuardian(guardian: Partial<Guardian>) {
    // Separa el nombre completo en nombre y apellidos si es necesario
    let nombres = guardian.name || '';
    let apellidos = '';
    
    if (nombres.includes(' ')) {
      const parts = nombres.split(' ');
      nombres = parts[0];
      apellidos = parts.slice(1).join(' ');
    }
    
    return apiService.post(API_ROUTES.TUTORES_LEGALES, {
      nombres: nombres,
      apellidos: apellidos,
      ci: guardian.ci || '',
      telefono: guardian.phone,
      email: guardian.email,
      parentesco: guardian.relationship || 'Familiar',
      es_el_mismo_estudiante: guardian.isSameAsStudent || false
    });
  },

  // Inscripciones individuales
  async getRegistrations(page = 1) {
    return apiService.get<PaginationResponse<Registration>>(
      `${API_ROUTES.INSCRIPCIONES}?page=${page}`
    );
  },

  async getRegistration(id: string) {
    return apiService.get<Registration>(`${API_ROUTES.INSCRIPCIONES}/${id}`);
  },

  async createRegistration(registration: Partial<Registration>) {
    return apiService.post<Registration>(API_ROUTES.INSCRIPCIONES, {
      id_estudiante: registration.studentId,
      id_convocatoria_area: registration.announcementAreaId,
      id_convocatoria_nivel: registration.announcementLevelId,
      id_tutor_academico: registration.academicTutorId || null
    });
  },

  async updateRegistration(id: string, registration: Partial<Registration>) {
    return apiService.put<Registration>(`${API_ROUTES.INSCRIPCIONES}/${id}`, {
      id_tutor_academico: registration.academicTutorId,
      estado: this.mapStatusToBackend(registration.status)
    });
  },

  // Listas de inscripción
  async getRegistrationLists(page = 1) {
    return apiService.get<PaginationResponse<RegistrationList>>(
      `${API_ROUTES.LISTAS_INSCRIPCION}?page=${page}`
    );
  },

  async getRegistrationList(id: string) {
    return apiService.get<RegistrationList>(`${API_ROUTES.LISTAS_INSCRIPCION}/${id}`);
  },

  async createRegistrationList(list: Partial<RegistrationList> & { detalles: Partial<RegistrationListDetail>[] }) {
    const formattedDetalles = list.detalles.map(detail => ({
      id_estudiante: detail.studentId,
      id_convocatoria_area: detail.announcementAreaId,
      id_convocatoria_nivel: detail.announcementLevelId,
      id_tutor_academico: detail.academicTutorId || null
    }));

    return apiService.post<RegistrationList>(API_ROUTES.LISTAS_INSCRIPCION, {
      id_unidad_educativa: list.educationalUnitId,
      detalles: formattedDetalles
    });
  },

  async addDetailToList(listId: string, detail: Partial<RegistrationListDetail>) {
    return apiService.post<RegistrationListDetail>(
      `${API_ROUTES.LISTAS_INSCRIPCION}/${listId}/detalles`,
      {
        id_estudiante: detail.studentId,
        id_convocatoria_area: detail.announcementAreaId,
        id_convocatoria_nivel: detail.announcementLevelId,
        id_tutor_academico: detail.academicTutorId || null
      }
    );
  },

  async removeDetailFromList(listId: string, detailId: string) {
    return apiService.delete<null>(
      `${API_ROUTES.LISTAS_INSCRIPCION}/${listId}/detalles/${detailId}`
    );
  },

  // Órdenes de pago
  async getPaymentOrders(page = 1) {
    return apiService.get<PaginationResponse<PaymentOrder>>(
      `${API_ROUTES.ORDENES_PAGO}?page=${page}`
    );
  },

  async getPaymentOrder(id: string) {
    return apiService.get<PaymentOrder>(`${API_ROUTES.ORDENES_PAGO}/${id}`);
  },

  async getPaymentOrderByCode(code: string) {
    return apiService.get<PaymentOrder>(
      `${API_ROUTES.ORDENES_PAGO_BUSCAR}?codigo=${encodeURIComponent(code)}`
    );
  },

  async createPaymentOrder(order: Partial<PaymentOrder>) {
    return apiService.post<PaymentOrder>(API_ROUTES.ORDENES_PAGO, {
      tipo_origen: order.sourceType,
      id_inscripcion: order.registrationId,
      id_lista: order.listId,
      fecha_vencimiento: order.dueDate
    });
  },

  // Comprobantes de pago
  async submitPaymentReceipt(receipt: Partial<PaymentReceipt>, pdfFile: File) {
    const formData = new FormData();
    formData.append('id_orden', receipt.orderId as string);
    formData.append('numero_comprobante', receipt.receiptNumber);
    formData.append('nombre_pagador', receipt.payerName);
    formData.append('fecha_pago', receipt.paymentDate);
    formData.append('monto_pagado', receipt.amountPaid?.toString() || '0');
    formData.append('pdf_comprobante', pdfFile);

    return apiService.post<PaymentReceipt>(
      API_ROUTES.COMPROBANTES_PAGO,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
  },

  // Mapear estado a formato del backend
  mapStatusToBackend(status?: 'pending' | 'paid' | 'verified'): string {
    switch (status) {
      case 'pending': return 'pendiente';
      case 'paid': return 'pagada';
      case 'verified': return 'verificada';
      default: return 'pendiente';
    }
  },

  // Mapear estado del backend al frontend
  mapStatusFromBackend(estado?: string): 'pending' | 'paid' | 'verified' {
    switch (estado) {
      case 'pendiente': return 'pending';
      case 'pagada': return 'paid';
      case 'verificada': return 'verified';
      default: return 'pending';
    }
  }
};
