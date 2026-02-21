import type { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import type { ApiResponse } from '../types/index.js';

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Zod validation error
  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    err.issues.forEach((issue) => {
      const path = issue.path.join('.');
      errors[path] = errors[path] ?? [];
      errors[path].push(issue.message);
    });
    const body: ApiResponse = { success: false, message: 'Validation error', errors };
    res.status(400).json(body);
    return;
  }

  // Prisma unique constraint violation
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === 'P2002'
  ) {
    const FIELD_MESSAGES: Record<string, string> = {
      email: 'Este correo ya está registrado',
      curp:  'Este CURP ya está en uso',
      rfc:   'Este RFC ya está en uso',
    };
    const targets = (err.meta?.target as string[]) ?? [];
    const errors: Record<string, string[]> = {};
    targets.forEach((f) => {
      errors[f] = [FIELD_MESSAGES[f] ?? `${f} ya está en uso`];
    });
    const firstField = targets[0] ?? 'field';
    const body: ApiResponse = {
      success: false,
      message: FIELD_MESSAGES[firstField] ?? `${firstField} ya está en uso`,
      errors,
    };
    res.status(409).json(body);
    return;
  }

  // App error
  if (err instanceof AppError) {
    const body: ApiResponse = { success: false, message: err.message };
    res.status(err.statusCode).json(body);
    return;
  }

  // Unknown error
  const message = env.NODE_ENV === 'production' ? 'Internal server error' : String(err);
  const body: ApiResponse = { success: false, message };
  res.status(500).json(body);
}
