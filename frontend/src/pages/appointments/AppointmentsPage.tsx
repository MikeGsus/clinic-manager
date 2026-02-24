import { useState } from 'react';
import { AppointmentCalendar } from '@/components/appointments/AppointmentCalendar';
import { AppointmentForm } from '@/components/appointments/AppointmentForm';

export function AppointmentsPage() {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Citas</h1>

      <AppointmentCalendar onNewAppointment={() => setFormOpen(true)} />

      <AppointmentForm open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
