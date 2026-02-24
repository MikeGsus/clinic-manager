import { prisma } from '../lib/prisma.js';

export function scheduleReminders(appointmentId: string, scheduledAt: Date): void {
  // Fire-and-forget: never throws
  (async () => {
    try {
      const reminders = [
        { channel: 'email', hoursBeore: 24 },
        { channel: 'email', hoursBeore: 2 },
      ];

      for (const r of reminders) {
        const scheduledFor = new Date(scheduledAt.getTime() - r.hoursBeore * 60 * 60 * 1000);
        if (scheduledFor > new Date()) {
          await prisma.appointmentReminder.create({
            data: {
              appointmentId,
              channel: r.channel,
              scheduledFor,
              status: 'pending',
            },
          });
        }
      }
    } catch (err) {
      console.error('[Reminder] Failed to schedule reminders:', err);
    }
  })();
}

export async function processDueReminders(): Promise<void> {
  try {
    const due = await prisma.appointmentReminder.findMany({
      where: {
        status: 'pending',
        scheduledFor: { lte: new Date() },
      },
      include: {
        appointment: {
          include: {
            patient: { select: { name: true, email: true } },
            doctor: { select: { name: true } },
          },
        },
      },
    });

    for (const reminder of due) {
      try {
        const { patient, doctor, scheduledAt } = reminder.appointment;
        console.log(
          `[REMINDER EMAIL] To: ${patient.email} | Patient: ${patient.name} | Doctor: Dr. ${doctor.name} | At: ${scheduledAt.toISOString()} | Channel: ${reminder.channel}`
        );

        await prisma.appointmentReminder.update({
          where: { id: reminder.id },
          data: { status: 'sent', sentAt: new Date() },
        });
      } catch (err) {
        console.error(`[Reminder] Failed to process reminder ${reminder.id}:`, err);
        await prisma.appointmentReminder.update({
          where: { id: reminder.id },
          data: { status: 'failed' },
        }).catch(() => {});
      }
    }
  } catch (err) {
    console.error('[Reminder] processDueReminders error:', err);
  }
}
