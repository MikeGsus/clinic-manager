export type Role = 'admin' | 'doctor' | 'enfermera' | 'recepcionista' | 'paciente';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string;
  curp?: string;
  rfc?: string;
  active: boolean;
  createdAt: string;
}

export interface Patient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  curp?: string;
  rfc?: string;
  address?: string;
  bloodType?: string;
  allergies?: string;
  notes?: string;
  active: boolean;
  doctorId?: string;
  doctor?: Pick<User, 'id' | 'name' | 'email'>;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface AuthData {
  token: string;
  user: User;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  entity?: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
  user?: Pick<User, 'id' | 'name' | 'email'>;
}
