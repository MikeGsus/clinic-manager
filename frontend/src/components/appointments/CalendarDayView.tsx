import { useState } from 'react';
import type { Appointment } from '@/types';
import { AppointmentCard } from './AppointmentCard';

interface CalendarDayViewProps {
  currentDate: Date;
  appointments: Appointment[];
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00–20:00
const SLOT_HEIGHT = 80; // px per hour

export function CalendarDayView({ currentDate, appointments }: CalendarDayViewProps) {
  const [selected, setSelected] = useState<Appointment | null>(null);

  const dayAppts = appointments.filter((a) => {
    const d = new Date(a.scheduledAt);
    return d.toDateString() === currentDate.toDateString();
  });

  function getStyle(appt: Appointment) {
    const d = new Date(appt.scheduledAt);
    const minutesFromTop = (d.getHours() - 8) * 60 + d.getMinutes();
    const top = (minutesFromTop / 60) * SLOT_HEIGHT;
    const height = Math.max((appt.durationMins / 60) * SLOT_HEIGHT, 30);
    return { top: `${top}px`, height: `${height}px` };
  }

  return (
    <div className="flex gap-4">
      {/* Time grid */}
      <div className="flex-1 border rounded-lg overflow-auto">
        <div className="relative" style={{ height: `${HOURS.length * SLOT_HEIGHT}px` }}>
          {/* Hour lines */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="absolute left-0 right-0 border-t border-gray-100 flex"
              style={{ top: `${(hour - 8) * SLOT_HEIGHT}px`, height: `${SLOT_HEIGHT}px` }}
            >
              <div className="w-14 text-xs text-gray-400 pr-2 text-right leading-none pt-1 shrink-0">
                {hour.toString().padStart(2, '0')}:00
              </div>
            </div>
          ))}

          {/* Appointments */}
          {dayAppts.map((appt) => (
            <div
              key={appt.id}
              className="absolute left-16 right-2 rounded-lg border p-2 cursor-pointer hover:shadow-md transition-shadow bg-white"
              style={getStyle(appt)}
              onClick={() => setSelected(selected?.id === appt.id ? null : appt)}
            >
              <div className="text-sm font-medium truncate">{appt.patient.name}</div>
              <div className="text-xs text-gray-500 truncate">
                {new Date(appt.scheduledAt).toLocaleTimeString('es-MX', {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'America/Mexico_City',
                })}{' '}
                · Dr. {appt.doctor.name}
              </div>
            </div>
          ))}

          {dayAppts.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
              Sin citas para este día
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-80 shrink-0">
          <AppointmentCard
            appointment={selected}
            onClose={() => setSelected(null)}
          />
        </div>
      )}
    </div>
  );
}
