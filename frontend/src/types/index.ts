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

export interface Level {
  id: string;
  name: string;
}

export interface Grade {
  id: string;
  name: string;
}

export interface CompetitionArea {
  id: string;
  name: string;
  description: string;
  level: string;
  cost: number;
}

export interface AreaCost {
  id: string;
  areaId: string;
  levelId: string;
  cost: number;
}

export interface RegistrationSummary {
  id: string;
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

export interface AdminStats {
  totalStudents: number;
  totalRevenue: number;
  pendingPayments: number;
  registrationsByArea: {
    name: string;
    count: number;
  }[];
}