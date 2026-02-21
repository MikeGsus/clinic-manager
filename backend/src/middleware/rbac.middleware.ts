import type { Response, NextFunction } from 'express';
import type { Role } from '@prisma/client';
import { AppError } from './error.middleware.js';
import type { AuthenticatedRequest } from '../types/index.js';

export const ROLE_GROUPS = {
  medical: ['admin', 'doctor', 'enfermera'] as Role[],
  staff: ['admin', 'doctor', 'enfermera', 'recepcionista'] as Role[],
  all: ['admin', 'doctor', 'enfermera', 'recepcionista', 'paciente'] as Role[],
};

export function requireRoles(...roles: Role[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError('Forbidden: insufficient permissions', 403);
    }

    next();
  };
}
