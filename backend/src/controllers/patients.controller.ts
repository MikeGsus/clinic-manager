import type { Request, Response } from 'express';
import { z } from 'zod';
import * as patientsService from '../services/patients.service.js';
import { ok } from '../types/index.js';
import type { AuthenticatedRequest } from '../types/index.js';

const phoneSchema = z
  .string()
  .regex(/^\d{10}$/, 'El teléfono debe tener exactamente 10 dígitos')
  .optional()
  .or(z.literal(''));

const patientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: phoneSchema,
  dateOfBirth: z.string().datetime().optional(),
  curp: z.string().max(18).optional(),
  rfc: z.string().max(12).optional(),
  address: z.string().optional(),
  bloodType: z.string().optional(),
  allergies: z.string().optional(),
  notes: z.string().optional(),
  doctorId: z.string().uuid().optional(),
});

const updatePatientSchema = patientSchema.partial();

function getActor(req: Request) {
  const user = (req as AuthenticatedRequest).user;
  return { role: user.role, id: user.sub };
}

export async function getAll(req: Request, res: Response): Promise<void> {
  const { role, id } = getActor(req);
  const patients = await patientsService.getAllPatients(role, id);
  res.json(ok(patients));
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { role, id: actorId } = getActor(req);
  const patient = await patientsService.getPatientById(req.params.id, role, actorId);
  res.json(ok(patient));
}

export async function create(req: Request, res: Response): Promise<void> {
  const data = patientSchema.parse(req.body);
  const patient = await patientsService.createPatient({
    ...data,
    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
  });
  res.status(201).json(ok(patient, 'Patient created'));
}

export async function update(req: Request, res: Response): Promise<void> {
  const { role, id: actorId } = getActor(req);
  const data = updatePatientSchema.parse(req.body);
  const patient = await patientsService.updatePatient(req.params.id, role, actorId, {
    ...data,
    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
  });
  res.json(ok(patient));
}

export async function remove(req: Request, res: Response): Promise<void> {
  const { role, id: actorId } = getActor(req);
  await patientsService.deletePatient(req.params.id, role, actorId);
  res.json(ok(null, 'Patient deactivated'));
}
