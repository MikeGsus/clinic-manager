import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import type { Role } from '@prisma/client';

function buildWhereClause(actorRole: Role, actorId: string) {
  // Doctors can only see their own patients
  if (actorRole === 'doctor') {
    return { doctorId: actorId, active: true };
  }
  return { active: true };
}

export async function getAllPatients(actorRole: Role, actorId: string) {
  return prisma.patient.findMany({
    where: buildWhereClause(actorRole, actorId),
    include: {
      doctor: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getPatientById(
  id: string,
  actorRole: Role,
  actorId: string
) {
  const where = { id, ...buildWhereClause(actorRole, actorId) };
  const patient = await prisma.patient.findFirst({ where });
  if (!patient) throw new AppError('Patient not found', 404);
  return patient;
}

export async function createPatient(data: {
  name: string;
  email?: string;
  phone?: string;
  dateOfBirth?: Date;
  curp?: string;
  rfc?: string;
  address?: string;
  bloodType?: string;
  allergies?: string;
  notes?: string;
  doctorId?: string;
}) {
  return prisma.patient.create({ data });
}

export async function updatePatient(
  id: string,
  actorRole: Role,
  actorId: string,
  data: Partial<{
    name: string;
    email: string;
    phone: string;
    dateOfBirth: Date;
    curp: string;
    rfc: string;
    address: string;
    bloodType: string;
    allergies: string;
    notes: string;
    doctorId: string;
    active: boolean;
  }>
) {
  const where = { id, ...buildWhereClause(actorRole, actorId) };
  const existing = await prisma.patient.findFirst({ where });
  if (!existing) throw new AppError('Patient not found', 404);

  return prisma.patient.update({ where: { id }, data });
}

export async function deletePatient(
  id: string,
  actorRole: Role,
  actorId: string
) {
  const where = { id, ...buildWhereClause(actorRole, actorId) };
  const existing = await prisma.patient.findFirst({ where });
  if (!existing) throw new AppError('Patient not found', 404);

  await prisma.patient.update({ where: { id }, data: { active: false } });
}
