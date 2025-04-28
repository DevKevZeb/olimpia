export interface Student {
    name: string;
    ci: string;
    birthDate: string;
    email: string;
    phone: string;
    areas: string[];
    guardian: {
      name: string;
      email: string;
      phone: string;
    };
  }
  
  export interface CompetitionArea {
    id: string;
    name: string;
    description: string;
    level: string;
    cost: number;
  }
  
  export interface RegistrationSummary {
    student: Student;
    areas: CompetitionArea[];
    totalCost: number;
    paymentStatus: 'pending' | 'completed';
    registrationDate: string;
  }
  
  export interface PaymentDetails {
    amount: number;
    currency: string;
    method: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    transactionId?: string;
    paymentDate?: string;
  }

  export interface EstudianteFormData {
    id: string;
    nombres: string;
    apellidos: string;
    ci: string;
    fecha_nacimiento: string;
    email: string;
    id_grado: string;
    unidad_educativa: {
      id_unidad_educativa: null | number;
      nombre: string;
      departamento: string;
      provincia: string;
    };
    tutor_legal: {
      nombres: string;
      apellidos: string;
      ci: string;
      telefono: string;
      email: string;
      parentesco: string;
      es_el_mismo_estudiante: boolean;
    };
    tutores_academicos: Array<any>;
    areas_seleccionadas: Array<any>;
  }