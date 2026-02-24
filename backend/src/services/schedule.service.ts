import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export async function getScheduleByDoctor(doctorId: string) {
  const schedules = await prisma.doctorSchedule.findMany({
    where: { doctorId },
    orderBy: { dayOfWeek: 'asc' },
  });

  // Return 7-element array (one per day); null if not configured
  return Array.from({ length: 7 }, (_, i) => {
    const found = schedules.find((s) => s.dayOfWeek === i);
    return found ?? null;
  });
}

export async function upsertDay(
  doctorId: string,
  dayOfWeek: number,
  data: {
    startTime: string;
    endTime: string;
    slotDuration: number;
    isActive: boolean;
  }
) {
  if (dayOfWeek < 0 || dayOfWeek > 6) {
    throw new AppError('dayOfWeek debe ser 0-6', 400);
  }

  return prisma.doctorSchedule.upsert({
    where: { doctorId_dayOfWeek: { doctorId, dayOfWeek } },
    create: { doctorId, dayOfWeek, ...data },
    update: data,
  });
}

export async function getExceptions(doctorId: string) {
  return prisma.scheduleException.findMany({
    where: { doctorId },
    orderBy: { date: 'asc' },
  });
}

export async function createException(
  doctorId: string,
  data: {
    date: Date;
    isBlocked: boolean;
    startTime?: string;
    endTime?: string;
    reason?: string;
  }
) {
  // Check if exception already exists
  const existing = await prisma.scheduleException.findUnique({
    where: { doctorId_date: { doctorId, date: data.date } },
  });
  if (existing) {
    throw new AppError('Ya existe una excepción para esa fecha', 409);
  }

  return prisma.scheduleException.create({
    data: { doctorId, ...data },
  });
}

export async function deleteException(id: string, doctorId: string) {
  const exception = await prisma.scheduleException.findUnique({ where: { id } });
  if (!exception) throw new AppError('Excepción no encontrada', 404);
  if (exception.doctorId !== doctorId) throw new AppError('Forbidden', 403);

  return prisma.scheduleException.delete({ where: { id } });
}
