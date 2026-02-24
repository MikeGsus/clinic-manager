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

// ─── Appointments ─────────────────────────────────────────────────────────────

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'RESCHEDULED';

export type AppointmentType =
  | 'CONSULTA'
  | 'SEGUIMIENTO'
  | 'URGENCIA'
  | 'PROCEDIMIENTO'
  | 'OTRO';

export interface Appointment {
  id: string;
  patientId: string;
  patient: Pick<Patient, 'id' | 'name' | 'email' | 'phone'>;
  doctorId: string;
  doctor: Pick<User, 'id' | 'name' | 'email'>;
  scheduledAt: string;
  durationMins: number;
  status: AppointmentStatus;
  type: AppointmentType;
  notes?: string;
  qrToken: string;
  checkedInAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleDay {
  id: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isActive: boolean;
}

export interface ScheduleException {
  id: string;
  doctorId: string;
  date: string;
  isBlocked: boolean;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

export interface WaitingListEntry {
  id: string;
  patientId: string;
  patient: Pick<Patient, 'id' | 'name' | 'email' | 'phone'>;
  doctorId?: string;
  doctor?: Pick<User, 'id' | 'name'>;
  preferredDate?: string;
  notes?: string;
  notifiedAt?: string;
  createdAt: string;
}

export interface TimeSlot {
  time: string;      // "HH:mm"
  available: boolean;
}
