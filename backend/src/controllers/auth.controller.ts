import type { Request, Response } from 'express';
import { z } from 'zod';
import {
  loginService,
  revokeRefreshToken,
  rotateRefreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
} from '../services/auth.service.js';
import { createAuditLog, getClientIp, getUserAgent } from '../services/audit.service.js';
import { ok } from '../types/index.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

const REFRESH_COOKIE = 'refresh_token';

function setRefreshCookie(res: Response, rawToken: string): void {
  res.cookie(REFRESH_COOKIE, rawToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: env.JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res: Response): void {
  res.cookie(REFRESH_COOKIE, '', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: 0,
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = loginSchema.parse(req.body);
  try {
    const { accessToken, rawRefreshToken, user } = await loginService(email, password);
    setRefreshCookie(res, rawRefreshToken);
    void createAuditLog({
      action: 'LOGIN_SUCCESS',
      userId: user.id,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      details: { email },
    });
    res.json(ok({ token: accessToken, user }));
  } catch (err) {
    void createAuditLog({
      action: 'LOGIN_FAILED',
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      details: { email },
    });
    throw err;
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  const rawToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  if (rawToken) {
    await revokeRefreshToken(rawToken);
  }
  clearRefreshCookie(res);
  const authReq = req as AuthenticatedRequest;
  void createAuditLog({
    action: 'LOGOUT',
    userId: authReq.user?.sub,
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
  });
  res.json(ok(null, 'Logged out successfully'));
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const rawToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  if (!rawToken) {
    res.status(401).json({ success: false, message: 'No refresh token' });
    return;
  }

  const { accessToken, rawRefreshToken, user } = await rotateRefreshToken(rawToken);
  setRefreshCookie(res, rawRefreshToken);
  void createAuditLog({
    action: 'TOKEN_REFRESH',
    userId: user.id,
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
  });
  res.json(ok({ token: accessToken, user }));
}

export async function me(req: Request, res: Response): Promise<void> {
  const { sub } = (req as AuthenticatedRequest).user;
  const user = await prisma.user.findUnique({
    where: { id: sub },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      active: true,
      createdAt: true,
    },
  });
  res.json(ok(user));
}

export async function changePasswordHandler(req: Request, res: Response): Promise<void> {
  const { sub } = (req as AuthenticatedRequest).user;
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
  await changePassword(sub, currentPassword, newPassword);
  void createAuditLog({
    action: 'PASSWORD_CHANGED',
    userId: sub,
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
  });
  res.json(ok(null, 'Password changed successfully'));
}

export async function forgotPasswordHandler(req: Request, res: Response): Promise<void> {
  const { email } = forgotPasswordSchema.parse(req.body);
  // Always return 200 (anti-enumeration)
  await forgotPassword(email);
  void createAuditLog({
    action: 'PASSWORD_RESET_REQUESTED',
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
    details: { email },
  });
  res.json(ok(null, 'If the email exists, a reset link has been sent'));
}

export async function resetPasswordHandler(req: Request, res: Response): Promise<void> {
  const { token, newPassword } = resetPasswordSchema.parse(req.body);
  await resetPassword(token, newPassword);
  void createAuditLog({
    action: 'PASSWORD_RESET_COMPLETED',
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
  });
  res.json(ok(null, 'Password reset successfully'));
}

export async function getAuditLogs(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt((req.query.page as string) ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) ?? '20', 10)));
  const action = req.query.action as string | undefined;
  const userId = req.query.userId as string | undefined;

  const where = {
    ...(action ? { action } : {}),
    ...(userId ? { userId } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  res.json(ok({ logs, total, page, limit }));
}
