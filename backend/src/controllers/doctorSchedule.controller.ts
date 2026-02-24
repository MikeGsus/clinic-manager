import type { Request, Response } from 'express';
import { z } from 'zod';
import * as scheduleService from '../services/schedule.service.js';
import { ok } from '../types/index.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { AppError } from '../middleware/error.middleware.js';

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

const upsertDaySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  slotDuration: z.number().int().positive().default(30),
  isActive: z.boolean().default(true),
});

const exceptionSchema = z.object({
  date: z.string().datetime(),
  isBlocked: z.boolean().default(true),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  reason: z.string().optional(),
});

export async function getSchedule(req: Request, res: Response): Promise<void> {
  const { role, id } = actor(req);

  let doctorId: string;
  if (role === 'doctor') {
    doctorId = id;
  } else if (role === 'admin' && query(req, 'doctorId')) {
    doctorId = z.string().uuid().parse(query(req, 'doctorId'));
  } else if (role === 'admin') {
    throw new AppError('Proporciona doctorId para admin', 400);
  } else {
    throw new AppError('Forbidden', 403);
  }

  const schedule = await scheduleService.getScheduleByDoctor(doctorId);
  res.json(ok(schedule));
}

export async function upsertDay(req: Request, res: Response): Promise<void> {
  const { role, id } = actor(req);
  const data = upsertDaySchema.parse(req.body);

  let doctorId: string;
  if (role === 'doctor') {
    doctorId = id;
  } else if (role === 'admin') {
    const qDoctorId = req.body.doctorId ?? query(req, 'doctorId');
    doctorId = z.string().uuid().parse(qDoctorId);
  } else {
    throw new AppError('Forbidden', 403);
  }

  const { dayOfWeek, ...rest } = data;
  const schedule = await scheduleService.upsertDay(doctorId, dayOfWeek, rest);
  res.json(ok(schedule));
}

export async function getExceptions(req: Request, res: Response): Promise<void> {
  const { role, id } = actor(req);

  let doctorId: string;
  if (role === 'doctor') {
    doctorId = id;
  } else if (role === 'admin' && query(req, 'doctorId')) {
    doctorId = z.string().uuid().parse(query(req, 'doctorId'));
  } else if (role === 'admin') {
    throw new AppError('Proporciona doctorId', 400);
  } else {
    throw new AppError('Forbidden', 403);
  }

  const exceptions = await scheduleService.getExceptions(doctorId);
  res.json(ok(exceptions));
}

export async function createException(req: Request, res: Response): Promise<void> {
  const { role, id } = actor(req);
  const data = exceptionSchema.parse(req.body);

  let doctorId: string;
  if (role === 'doctor') {
    doctorId = id;
  } else if (role === 'admin') {
    doctorId = z.string().uuid().parse(req.body.doctorId);
  } else {
    throw new AppError('Forbidden', 403);
  }

  const exception = await scheduleService.createException(doctorId, {
    ...data,
    date: new Date(data.date),
  });
  res.status(201).json(ok(exception));
}

export async function deleteException(req: Request, res: Response): Promise<void> {
  const { role, id } = actor(req);

  let doctorId: string;
  if (role === 'doctor') {
    doctorId = id;
  } else if (role === 'admin') {
    doctorId = query(req, 'doctorId') ?? id;
  } else {
    throw new AppError('Forbidden', 403);
  }

  await scheduleService.deleteException(param(req, 'id'), doctorId);
  res.json(ok(null, 'Excepción eliminada'));
}
