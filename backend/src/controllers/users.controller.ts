import type { Request, Response } from 'express';
import { z } from 'zod';
import * as usersService from '../services/users.service.js';
import { createAuditLog, getClientIp, getUserAgent } from '../services/audit.service.js';
import { ok } from '../types/index.js';
import type { AuthenticatedRequest } from '../types/index.js';

const phoneSchema = z
  .string()
  .regex(/^\d{10}$/, 'El teléfono debe tener exactamente 10 dígitos')
  .optional()
  .or(z.literal(''));

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.enum(['admin', 'doctor', 'enfermera', 'recepcionista', 'paciente']),
  curp: z.string().max(18).optional(),
  rfc: z.string().max(12).optional(),
  phone: phoneSchema,
});

const updateUserSchema = createUserSchema
  .omit({ email: true, password: true })
  .extend({ active: z.boolean().optional() })
  .partial();

const updateMeSchema = z.object({
  name: z.string().min(1).optional(),
  phone: phoneSchema,
  curp: z.string().max(18).optional(),
  rfc: z.string().max(12).optional(),
});

export async function getAll(_req: Request, res: Response): Promise<void> {
  const users = await usersService.getAllUsers();
  res.json(ok(users));
}

export async function getById(req: Request, res: Response): Promise<void> {
  const user = await usersService.getUserById(req.params.id as string);
  res.json(ok(user));
}

export async function create(req: Request, res: Response): Promise<void> {
  const data = createUserSchema.parse(req.body);
  const user = await usersService.createUser(data);
  const authReq = req as AuthenticatedRequest;
  void createAuditLog({
    action: 'USER_CREATED',
    userId: authReq.user?.sub,
    entity: 'User',
    entityId: user.id,
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
    details: { email: user.email, role: user.role },
  });
  res.status(201).json(ok(user, 'User created'));
}

export async function update(req: Request, res: Response): Promise<void> {
  const data = updateUserSchema.parse(req.body);
  const authReq = req as AuthenticatedRequest;
  const existingUser = await usersService.getUserById(req.params.id as string);
  const user = await usersService.updateUser(req.params.id as string, data);

  const action = data.role && data.role !== existingUser.role ? 'ROLE_CHANGED' : 'USER_UPDATED';
  void createAuditLog({
    action,
    userId: authReq.user?.sub,
    entity: 'User',
    entityId: user.id,
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
    details: data,
  });
  res.json(ok(user));
}

export async function remove(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  await usersService.deleteUser(req.params.id as string);
  void createAuditLog({
    action: 'USER_DEACTIVATED',
    userId: authReq.user?.sub,
    entity: 'User',
    entityId: req.params.id as string,
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
  });
  res.json(ok(null, 'User deactivated'));
}

export async function getMe(req: Request, res: Response): Promise<void> {
  const { sub } = (req as AuthenticatedRequest).user;
  const user = await usersService.getUserById(sub);
  res.json(ok(user));
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  const { sub } = (req as AuthenticatedRequest).user;
  const data = updateMeSchema.parse(req.body);
  const user = await usersService.updateOwnProfile(sub, data);
  void createAuditLog({
    action: 'USER_UPDATED',
    userId: sub,
    entity: 'User',
    entityId: sub,
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
    details: { self: true, ...data },
  });
  res.json(ok(user));
}
