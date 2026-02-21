import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Admin1234!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@clinica.mx' },
    update: {},
    create: {
      email: 'admin@clinica.mx',
      password: hashedPassword,
      name: 'Administrador',
      role: Role.admin,
    },
  });

  const doctor = await prisma.user.upsert({
    where: { email: 'doctor@clinica.mx' },
    update: {},
    create: {
      email: 'doctor@clinica.mx',
      password: await bcrypt.hash('Doctor1234!', 12),
      name: 'Dr. Juan García',
      role: Role.doctor,
    },
  });

  // Sample patient
  await prisma.patient.upsert({
    where: { email: 'paciente@ejemplo.mx' },
    update: {},
    create: {
      name: 'María López',
      email: 'paciente@ejemplo.mx',
      phone: '+52 55 1234 5678',
      dateOfBirth: new Date('1985-06-15'),
      bloodType: 'O+',
      doctorId: doctor.id,
    },
  });

  console.log('Seed complete.');
  console.log(`Admin: ${admin.email}`);
  console.log(`Doctor: ${doctor.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
