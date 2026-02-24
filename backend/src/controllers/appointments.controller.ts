import type { Request, Response } from 'express';
import { z } from 'zod';
import * as appointmentsService from '../services/appointments.service.js';
import { ok } from '../types/index.js';
import type { AuthenticatedRequest } from '../types/index.js';

function actor(req: Request) {
  const user = (req as AuthenticatedRequest).user;
  return { role: user.role, id: user.sub };
}

function param(req: Request, key: string): string {
  const val = (req.params as Record<string, string | string[]>)[key];
  return Array.isArray(val) ? val[0] : (val ?? '');
}

function query(req: Request, key: string): string | undefined {
  const val = (req.query as Record<string, string | string[]>)[key];
  return Array.isArray(val) ? val[0] : val;
}

const createSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  durationMins: z.number().int().positive().default(30),
  type: z.enum(['CONSULTA', 'SEGUIMIENTO', 'URGENCIA', 'PROCEDIMIENTO', 'OTRO']).optional(),
  notes: z.string().optional(),
});

const updateSchema = z.object({
  status: z
    .enum(['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED'])
    .optional(),
  notes: z.string().optional(),
  type: z.enum(['CONSULTA', 'SEGUIMIENTO', 'URGENCIA', 'PROCEDIMIENTO', 'OTRO']).optional(),
});

const cancelSchema = z.object({
  reason: z.string().optional(),
});

const rescheduleSchema = z.object({
  scheduledAt: z.string().datetime(),
  durationMins: z.number().int().positive().optional(),
});

export async function listAppointments(req: Request, res: Response): Promise<void> {
  const { role, id } = actor(req);
  const appointments = await appointmentsService.listAppointments({
    role,
    userId: id,
    status: query(req, 'status'),
    doctorId: query(req, 'doctorId'),
    patientId: query(req, 'patientId'),
    from: query(req, 'from'),
    to: query(req, 'to'),
  });
  res.json(ok(appointments));
}

export async function getAvailableSlots(req: Request, res: Response): Promise<void> {
  const doctorId = z.string().uuid().parse(query(req, 'doctorId'));
  const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(query(req, 'date'));
  const slots = await appointmentsService.getAvailableSlots(doctorId, date);
  res.json(ok(slots));
}

export async function getAppointment(req: Request, res: Response): Promise<void> {
  const appt = await appointmentsService.getAppointmentById(param(req, 'id'));
  res.json(ok(appt));
}

export async function getByQRToken(req: Request, res: Response): Promise<void> {
  const appt = await appointmentsService.getAppointmentByQRToken(param(req, 'qrToken'));
  res.json(ok(appt));
}

export async function checkIn(req: Request, res: Response): Promise<void> {
  const appt = await appointmentsService.checkInByQRToken(param(req, 'qrToken'));
  res.json(ok(appt, 'Check-in realizado'));
}

export async function createAppointment(req: Request, res: Response): Promise<void> {
  const data = createSchema.parse(req.body);
  const appt = await appointmentsService.createAppointment({
    ...data,
    scheduledAt: new Date(data.scheduledAt),
  });
  res.status(201).json(ok(appt, 'Cita creada'));
}

export async function updateAppointment(req: Request, res: Response): Promise<void> {
  const data = updateSchema.parse(req.body);
  const appt = await appointmentsService.updateAppointment(param(req, 'id'), data);
  res.json(ok(appt));
}

export async function cancelAppointment(req: Request, res: Response): Promise<void> {
  const { reason } = cancelSchema.parse(req.body);
  const { id: cancelledById } = actor(req);
  const appt = await appointmentsService.cancelAppointment(param(req, 'id'), cancelledById, reason);
  res.json(ok(appt, 'Cita cancelada'));
}

export async function rescheduleAppointment(req: Request, res: Response): Promise<void> {
  const { scheduledAt, durationMins } = rescheduleSchema.parse(req.body);
  const appt = await appointmentsService.rescheduleAppointment(
    param(req, 'id'),
    new Date(scheduledAt),
    durationMins
  );
  res.json(ok(appt, 'Cita reagendada'));
}
