import api from './api';
import type { Appointment, ScheduleDay, ScheduleException, WaitingListEntry, TimeSlot } from '@/types';
import type { ApiResponse } from '@/types';

// ─── Appointments ─────────────────────────────────────────────────────────────

export async function fetchAppointments(params?: {
  status?: string;
  doctorId?: string;
  patientId?: string;
  from?: string;
  to?: string;
}): Promise<Appointment[]> {
  const res = await api.get<ApiResponse<Appointment[]>>('/appointments', { params });
  return res.data.data!;
}

export async function fetchAvailableSlots(doctorId: string, date: string): Promise<TimeSlot[]> {
  const res = await api.get<ApiResponse<TimeSlot[]>>('/appointments/available-slots', {
    params: { doctorId, date },
  });
  return res.data.data!;
}

export async function fetchAppointmentById(id: string): Promise<Appointment> {
  const res = await api.get<ApiResponse<Appointment>>(`/appointments/${id}`);
  return res.data.data!;
}

export async function fetchAppointmentByQR(qrToken: string): Promise<Appointment> {
  const res = await api.get<ApiResponse<Appointment>>(`/appointments/checkin/${qrToken}`);
  return res.data.data!;
}

export async function createAppointment(data: {
  patientId: string;
  doctorId: string;
  scheduledAt: string;
  durationMins: number;
  type?: string;
  notes?: string;
}): Promise<Appointment> {
  const res = await api.post<ApiResponse<Appointment>>('/appointments', data);
  return res.data.data!;
}

export async function cancelAppointment(id: string, reason?: string): Promise<Appointment> {
  const res = await api.post<ApiResponse<Appointment>>(`/appointments/${id}/cancel`, { reason });
  return res.data.data!;
}

export async function rescheduleAppointment(
  id: string,
  data: { scheduledAt: string; durationMins?: number }
): Promise<Appointment> {
  const res = await api.post<ApiResponse<Appointment>>(`/appointments/${id}/reschedule`, data);
  return res.data.data!;
}

export async function checkIn(qrToken: string): Promise<Appointment> {
  const res = await api.post<ApiResponse<Appointment>>(`/appointments/checkin/${qrToken}`);
  return res.data.data!;
}

// ─── Doctor Schedule ──────────────────────────────────────────────────────────

export async function fetchDoctorSchedule(doctorId?: string): Promise<(ScheduleDay | null)[]> {
  const res = await api.get<ApiResponse<(ScheduleDay | null)[]>>('/doctor-schedule', {
    params: doctorId ? { doctorId } : {},
  });
  return res.data.data!;
}

export async function upsertScheduleDay(data: {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isActive: boolean;
  doctorId?: string;
}): Promise<ScheduleDay> {
  const res = await api.put<ApiResponse<ScheduleDay>>('/doctor-schedule/day', data);
  return res.data.data!;
}

export async function fetchExceptions(doctorId?: string): Promise<ScheduleException[]> {
  const res = await api.get<ApiResponse<ScheduleException[]>>('/doctor-schedule/exceptions', {
    params: doctorId ? { doctorId } : {},
  });
  return res.data.data!;
}

export async function createException(data: {
  date: string;
  isBlocked: boolean;
  startTime?: string;
  endTime?: string;
  reason?: string;
  doctorId?: string;
}): Promise<ScheduleException> {
  const res = await api.post<ApiResponse<ScheduleException>>('/doctor-schedule/exceptions', data);
  return res.data.data!;
}

export async function deleteException(id: string): Promise<void> {
  await api.delete(`/doctor-schedule/exceptions/${id}`);
}

// ─── Waiting List ─────────────────────────────────────────────────────────────

export async function fetchWaitingList(): Promise<WaitingListEntry[]> {
  const res = await api.get<ApiResponse<WaitingListEntry[]>>('/waiting-list');
  return res.data.data!;
}

export async function addToWaitingList(data: {
  patientId: string;
  doctorId?: string;
  preferredDate?: string;
  notes?: string;
}): Promise<WaitingListEntry> {
  const res = await api.post<ApiResponse<WaitingListEntry>>('/waiting-list', data);
  return res.data.data!;
}

export async function removeFromWaitingList(id: string): Promise<void> {
  await api.delete(`/waiting-list/${id}`);
}
