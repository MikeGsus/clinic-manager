import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import type { Role } from '@prisma/client';

export async function getAllUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      curp: true,
      rfc: true,
      phone: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      curp: true,
      rfc: true,
      phone: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) throw new AppError('User not found', 404);
  return user;
}

export async function createUser(data: {
  email: string;
  password: string;
  name: string;
  role: Role;
  curp?: string;
  rfc?: string;
  phone?: string;
}) {
  const hashed = await bcrypt.hash(data.password, 12);
  const { password: _, ...user } = await prisma.user.create({
    data: {
      ...data,
      password: hashed,
      curp: data.curp?.toUpperCase(),
      rfc: data.rfc?.toUpperCase(),
    },
  });
  return user;
}

export async function updateUser(
  id: string,
  data: Partial<{
    name: string;
    role: Role;
    curp: string;
    rfc: string;
    phone: string;
    active: boolean;
  }>
) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new AppError('User not found', 404);

  const { password: _, ...user } = await prisma.user.update({
    where: { id },
    data: {
      ...data,
      curp: data.curp?.toUpperCase(),
      rfc: data.rfc?.toUpperCase(),
    },
  });
  return user;
}

export async function deleteUser(id: string) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new AppError('User not found', 404);

  await prisma.user.update({ where: { id }, data: { active: false } });
}

const SAFE_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  curp: true,
  rfc: true,
  phone: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function updateOwnProfile(
  userId: string,
  data: { name?: string; phone?: string; curp?: string; rfc?: string }
) {
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) throw new AppError('User not found', 404);

  return prisma.user.update({
    where: { id: userId },
    data: {
      ...data,
      curp: data.curp?.toUpperCase(),
      rfc: data.rfc?.toUpperCase(),
    },
    select: SAFE_SELECT,
  });
}
