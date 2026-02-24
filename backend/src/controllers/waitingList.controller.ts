import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { ok } from '../types/index.js';
import { AppError } from '../middleware/error.middleware.js';

function param(req: Request, key: string): string {
  const val = (req.params as Record<string, string | string[]>)[key];
  return Array.isArray(val) ? val[0] : (val ?? '');
}

const addSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid().optional(),
  preferredDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export async function listWaitingList(_req: Request, res: Response): Promise<void> {
  const entries = await prisma.waitingList.findMany({
    include: {
      patient: { select: { id: true, name: true, email: true, phone: true } },
      doctor: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
  res.json(ok(entries));
}

export async function addToWaitingList(req: Request, res: Response): Promise<void> {
  const data = addSchema.parse(req.body);
  const entry = await prisma.waitingList.create({
    data: {
      patientId: data.patientId,
      doctorId: data.doctorId,
      preferredDate: data.preferredDate ? new Date(data.preferredDate) : undefined,
      notes: data.notes,
    },
    include: {
      patient: { select: { id: true, name: true, email: true } },
      doctor: { select: { id: true, name: true } },
    },
  });
  res.status(201).json(ok(entry, 'Agregado a lista de espera'));
}

export async function removeFromWaitingList(req: Request, res: Response): Promise<void> {
  const id = param(req, 'id');
  const entry = await prisma.waitingList.findUnique({ where: { id } });
  if (!entry) throw new AppError('Entrada no encontrada', 404);

  await prisma.waitingList.delete({ where: { id } });
  res.json(ok(null, 'Eliminado de lista de espera'));
}
