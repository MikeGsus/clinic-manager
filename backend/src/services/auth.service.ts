import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { AppError } from '../middleware/error.middleware.js';
import type { JwtPayload } from '../types/index.js';

const INVALID_CREDENTIALS = 'Invalid email or password';

function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function generateRawToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

export async function createRefreshToken(userId: string): Promise<string> {
  const raw = generateRawToken();
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + env.JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: { tokenHash, userId, expiresAt },
  });

  return raw;
}

export async function rotateRefreshToken(rawToken: string): Promise<{
  accessToken: string;
  rawRefreshToken: string;
  user: Omit<Awaited<ReturnType<typeof prisma.user.findUniqueOrThrow>>, 'password'>;
}> {
  const tokenHash = hashToken(rawToken);
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!stored) throw new AppError('Invalid refresh token', 401);
  if (stored.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { tokenHash } });
    throw new AppError('Refresh token expired', 401);
  }
  if (!stored.user.active) throw new AppError('Account is deactivated', 403);

  // Rotate: delete old, create new
  await prisma.refreshToken.delete({ where: { tokenHash } });
  const rawRefreshToken = await createRefreshToken(stored.userId);

  const payload: JwtPayload = {
    sub: stored.user.id,
    email: stored.user.email,
    role: stored.user.role,
  };
  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

  const { password: _, ...user } = stored.user;
  return { accessToken, rawRefreshToken, user };
}

export async function revokeRefreshToken(rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken);
  await prisma.refreshToken.deleteMany({ where: { tokenHash } });
}

export async function revokeAllUserRefreshTokens(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { userId } });
}

export async function changePassword(
  userId: string,
  currentPw: string,
  newPw: string
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  const match = await bcrypt.compare(currentPw, user.password);
  if (!match) throw new AppError('Current password is incorrect', 400);

  const hashed = await bcrypt.hash(newPw, 12);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
}

export async function forgotPassword(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  // Always succeed to prevent enumeration
  if (!user) return;

  // Invalidate existing reset tokens
  await prisma.passwordReset.deleteMany({ where: { userId: user.id } });

  const raw = generateRawToken();
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await prisma.passwordReset.create({
    data: { tokenHash, userId: user.id, expiresAt },
  });

  // Mock: log token to console (replace with email service in production)
  console.log('\n========================================');
  console.log('🔑 PASSWORD RESET TOKEN (mock)');
  console.log(`   User: ${user.email}`);
  console.log(`   Token: ${raw}`);
  console.log(`   Expires: ${expiresAt.toISOString()}`);
  console.log('========================================\n');
}

export async function resetPassword(rawToken: string, newPw: string): Promise<void> {
  const tokenHash = hashToken(rawToken);
  const reset = await prisma.passwordReset.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!reset) throw new AppError('Invalid or expired reset token', 400);
  if (reset.used) throw new AppError('Reset token already used', 400);
  if (reset.expiresAt < new Date()) throw new AppError('Reset token expired', 400);

  const hashed = await bcrypt.hash(newPw, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: reset.userId }, data: { password: hashed } }),
    prisma.passwordReset.update({ where: { tokenHash }, data: { used: true } }),
    // Revoke all refresh tokens on password reset
    prisma.refreshToken.deleteMany({ where: { userId: reset.userId } }),
  ]);
}

export async function loginService(email: string, password: string) {
  // Anti-enumeration: same message for user-not-found and wrong-password
  const user = await prisma.user.findUnique({ where: { email } });

  const passwordMatch = user
    ? await bcrypt.compare(password, user.password)
    : await bcrypt.compare(password, '$2a$12$placeholderHashToPreventTimingAttacks..x');

  if (!user || !passwordMatch) {
    throw new AppError(INVALID_CREDENTIALS, 401);
  }

  if (!user.active) {
    throw new AppError('Account is deactivated', 403);
  }

  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

  const rawRefreshToken = await createRefreshToken(user.id);
  const { password: _, ...userWithoutPassword } = user;
  return { accessToken, rawRefreshToken, user: userWithoutPassword };
}
