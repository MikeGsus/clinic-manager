import type { Role } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import { scheduleReminders } from './reminder.service.js';

// ─── Slot computation ─────────────────────────────────────────────────────────

export async function getAvailableSlots(doctorId: string, dateStr: string): Promise<{ time: string; available: boolean }[]> {
  const date = new Date(dateStr);
  const dayOfWeek = date.getUTCDay();

  // Check for schedule exception on this date
  const exception = await prisma.scheduleException.findUnique({
    where: { doctorId_date: { doctorId, date } },
  });

  if (exception?.isBlocked) return [];

  // Get schedule for this day
  const schedule = await prisma.doctorSchedule.findUnique({
    where: { doctorId_dayOfWeek: { doctorId, dayOfWeek } },
  });

  if (!schedule || !schedule.isActive) return [];

  const startTime = exception?.startTime ?? schedule.startTime;
  const endTime = exception?.endTime ?? schedule.endTime;
  const slotDuration = schedule.slotDuration;

  // Generate all slots for the day
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  const allSlots: string[] = [];
  for (let m = startMinutes; m + slotDuration <= endMinutes; m += slotDuration) {
    const h = Math.floor(m / 60).toString().padStart(2, '0');
    const min = (m % 60).toString().padStart(2, '0');
    allSlots.push(`${h}:${min}`);
  }

  // Use local date components so timestamps match the frontend's setHours() approach
  const [y, mo, d] = dateStr.split('-').map(Number);
  const dayStart = new Date(y, mo - 1, d, 0, 0, 0, 0);
  const dayEnd   = new Date(y, mo - 1, d, 23, 59, 59, 999);

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      scheduledAt: { gte: dayStart, lte: dayEnd },
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
    },
    select: { scheduledAt: true, durationMins: true },
  });

  return allSlots.map((slot) => {
    const [sh, sm] = slot.split(':').map(Number);
    const slotStart = new Date(y, mo - 1, d, sh, sm, 0, 0).getTime();
    const slotEnd = slotStart + slotDuration * 60 * 1000;

    const booked = existingAppointments.some((appt) => {
      const apptStart = appt.scheduledAt.getTime();
      const apptEnd = apptStart + appt.durationMins * 60 * 1000;
      return slotStart < apptEnd && slotEnd > apptStart;
    });

    return { time: slot, available: !booked };
  });
}

// ─── Conflict check ───────────────────────────────────────────────────────────

export async function hasConflict(
  doctorId: string,
  scheduledAt: Date,
  durationMins: number,
  excludeId?: string
): Promise<boolean> {
  const end = new Date(scheduledAt.getTime() + durationMins * 60 * 1000);

  const conflict = await prisma.appointment.findFirst({
    where: {
      doctorId,
      id: excludeId ? { not: excludeId } : undefined,
      status: { notIn: ['CANCELLED', 'NO_SHOW', 'RESCHEDULED'] },
      AND: [{ scheduledAt: { lt: end } }, { scheduledAt: { gte: new Date(scheduledAt.getTime() - durationMins * 60 * 1000) } }],
    },
  });

  if (!conflict) return false;

  // Precise overlap: conflict.scheduledAt < end AND conflict.scheduledAt + conflict.durationMins > scheduledAt
  const conflictEnd = new Date(conflict.scheduledAt.getTime() + conflict.durationMins * 60 * 1000);
  return conflict.scheduledAt < end && conflictEnd > scheduledAt;
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function createAppointment(data: {
  patientId: string;
  doctorId: string;
  scheduledAt: Date;
  durationMins: number;
  type?: string;
  notes?: string;
}) {
  if (await hasConflict(data.doctorId, data.scheduledAt, data.durationMins)) {
    throw new AppError('El doctor ya tiene una cita en ese horario', 409);
  }

  const appointment = await prisma.appointment.create({
    data: {
      patientId: data.patientId,
      doctorId: data.doctorId,
      scheduledAt: data.scheduledAt,
      durationMins: data.durationMins,
      type: data.type as any ?? 'CONSULTA',
      notes: data.notes,
    },
    include: {
      patient: { select: { id: true, name: true, email: true } },
      doctor: { select: { id: true, name: true, email: true } },
    },
  });

  scheduleReminders(appointment.id, appointment.scheduledAt);

  return appointment;
}

export async function listAppointments(filters: {
  role: Role;
  userId: string;
  status?: string;
  doctorId?: string;
  patientId?: string;
  from?: string;
  to?: string;
}) {
  const where: Record<string, unknown> = {};

  if (filters.role === 'paciente') {
    // Patients see only their own appointments
    const patient = await prisma.patient.findFirst({ where: { curp: undefined } });
    // For patient role, we match by user email → patient record
    where.patient = { email: { equals: undefined } };
    // Fall back: filter by doctorId = self won't work; instead we scope by matching user somehow
    // Since patients are User records and Patient records are separate, we match by patientId with same email
    where.patientId = filters.userId; // won't match unless patientId = userId; handled in controller
  } else if (filters.role === 'doctor') {
    where.doctorId = filters.userId;
  }

  if (filters.status) where.status = filters.status;
  if (filters.doctorId && filters.role !== 'doctor') where.doctorId = filters.doctorId;
  if (filters.patientId) where.patientId = filters.patientId;
  if (filters.from || filters.to) {
    where.scheduledAt = {
      ...(filters.from ? { gte: new Date(filters.from) } : {}),
      ...(filters.to ? { lte: new Date(filters.to) } : {}),
    };
  }

  return prisma.appointment.findMany({
    where,
    include: {
      patient: { select: { id: true, name: true, email: true, phone: true } },
      doctor: { select: { id: true, name: true, email: true } },
    },
    orderBy: { scheduledAt: 'asc' },
  });
}

export async function getAppointmentById(id: string) {
  const appt = await prisma.appointment.findUnique({
    where: { id },
    include: {
      patient: { select: { id: true, name: true, email: true, phone: true } },
      doctor: { select: { id: true, name: true, email: true } },
      reminders: true,
    },
  });
  if (!appt) throw new AppError('Cita no encontrada', 404);
  return appt;
}

export async function updateAppointment(
  id: string,
  data: { status?: string; notes?: string; type?: string }
) {
  const appt = await prisma.appointment.findUnique({ where: { id } });
  if (!appt) throw new AppError('Cita no encontrada', 404);

  return prisma.appointment.update({
    where: { id },
    data: {
      status: data.status as any,
      notes: data.notes,
      type: data.type as any,
    },
    include: {
      patient: { select: { id: true, name: true, email: true } },
      doctor: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function cancelAppointment(id: string, cancelledById: string, reason?: string) {
  const appt = await prisma.appointment.findUnique({ where: { id } });
  if (!appt) throw new AppError('Cita no encontrada', 404);
  if (appt.status === 'CANCELLED') throw new AppError('La cita ya está cancelada', 400);

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      cancelledById,
      cancellationReason: reason,
    },
  });

  // Notify first waiting list entry for this doctor
  const waiting = await prisma.waitingList.findFirst({
    where: { doctorId: appt.doctorId },
    orderBy: { createdAt: 'asc' },
    include: { patient: { select: { name: true, email: true } } },
  });

  if (waiting) {
    console.log(
      `[WAITING LIST] Notifying ${waiting.patient.name} (${waiting.patient.email}) about freed slot on ${appt.scheduledAt.toISOString()}`
    );
    await prisma.waitingList.update({
      where: { id: waiting.id },
      data: { notifiedAt: new Date() },
    });
  }

  return updated;
}

export async function rescheduleAppointment(
  id: string,
  newScheduledAt: Date,
  durationMins?: number
) {
  const appt = await prisma.appointment.findUnique({ where: { id } });
  if (!appt) throw new AppError('Cita no encontrada', 404);

  const duration = durationMins ?? appt.durationMins;

  if (await hasConflict(appt.doctorId, newScheduledAt, duration, id)) {
    throw new AppError('El doctor ya tiene una cita en ese horario', 409);
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      scheduledAt: newScheduledAt,
      durationMins: duration,
      status: 'RESCHEDULED',
    },
    include: {
      patient: { select: { id: true, name: true, email: true } },
      doctor: { select: { id: true, name: true, email: true } },
    },
  });

  // Cancel old reminders and schedule new ones
  await prisma.appointmentReminder.deleteMany({ where: { appointmentId: id, status: 'pending' } });
  scheduleReminders(id, newScheduledAt);

  return updated;
}

export async function checkInByQRToken(qrToken: string) {
  const appt = await prisma.appointment.findUnique({
    where: { qrToken },
    include: {
      patient: { select: { id: true, name: true, email: true } },
      doctor: { select: { id: true, name: true, email: true } },
    },
  });
  if (!appt) throw new AppError('QR inválido o cita no encontrada', 404);
  if (appt.status === 'CHECKED_IN') throw new AppError('El paciente ya hizo check-in', 400);
  if (appt.status === 'CANCELLED') throw new AppError('La cita está cancelada', 400);

  return prisma.appointment.update({
    where: { id: appt.id },
    data: { status: 'CHECKED_IN', checkedInAt: new Date() },
    include: {
      patient: { select: { id: true, name: true, email: true } },
      doctor: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function getAppointmentByQRToken(qrToken: string) {
  const appt = await prisma.appointment.findUnique({
    where: { qrToken },
    include: {
      patient: { select: { id: true, name: true, email: true, phone: true } },
      doctor: { select: { id: true, name: true, email: true } },
    },
  });
  if (!appt) throw new AppError('QR inválido o cita no encontrada', 404);
  return appt;
}
