import type { Request } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export type AuditAction =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'TOKEN_REFRESH'
  | 'PASSWORD_CHANGED'
  | 'PASSWORD_RESET_REQUESTED'
  | 'PASSWORD_RESET_COMPLETED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DEACTIVATED'
  | 'ROLE_CHANGED';

export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip ?? 'unknown';
}

export function getUserAgent(req: Request): string | undefined {
  const ua = req.headers['user-agent'];
  return Array.isArray(ua) ? ua[0] : ua;
}

export async function createAuditLog(opts: {
  action: AuditAction;
  userId?: string;
  entity?: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: opts.action,
        userId: opts.userId,
        entity: opts.entity,
        entityId: opts.entityId,
        details: opts.details ? (opts.details as Prisma.InputJsonValue) : Prisma.JsonNull,
        ipAddress: opts.ipAddress,
        userAgent: opts.userAgent,
      },
    });
  } catch (err) {
    // Fire-and-forget: never throw, just log
    console.error('[AuditLog] Failed to write audit log:', err);
  }
}
