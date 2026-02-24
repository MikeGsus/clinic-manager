import type { Appointment } from '@/types';

interface CalendarWeekViewProps {
  currentDate: Date;
  appointments: Appointment[];
}

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 border-blue-400 text-blue-800',
  CONFIRMED: 'bg-green-100 border-green-400 text-green-800',
  CHECKED_IN: 'bg-teal-100 border-teal-400 text-teal-800',
  COMPLETED: 'bg-gray-100 border-gray-400 text-gray-700',
  CANCELLED: 'bg-red-100 border-red-400 text-red-700 line-through',
  NO_SHOW: 'bg-orange-100 border-orange-400 text-orange-700',
  RESCHEDULED: 'bg-purple-100 border-purple-400 text-purple-700',
};

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00–20:00

export function CalendarWeekView({ currentDate, appointments }: CalendarWeekViewProps) {
  // Get start of week (Sunday)
  const weekStart = new Date(currentDate);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const today = new Date();

  function getApptStyle(appt: Appointment, slotHeight: number) {
    const d = new Date(appt.scheduledAt);
    const minutesFromTop = (d.getHours() - 8) * 60 + d.getMinutes();
    const top = (minutesFromTop / 60) * slotHeight;
    const height = Math.max((appt.durationMins / 60) * slotHeight, 20);
    return { top: `${top}px`, height: `${height}px` };
  }

  const slotHeight = 60; // px per hour

  return (
    <div className="border rounded-lg overflow-auto">
      <div className="grid" style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}>
        {/* Header */}
        <div className="border-b border-r bg-gray-50 py-2" />
        {days.map((day, i) => {
          const isToday = day.toDateString() === today.toDateString();
          return (
            <div key={i} className={`border-b border-r py-2 text-center text-sm ${isToday ? 'bg-blue-50' : 'bg-gray-50'}`}>
              <div className="text-xs text-gray-500">
                {day.toLocaleDateString('es-MX', { weekday: 'short' })}
              </div>
              <div className={`font-semibold ${isToday ? 'text-blue-600' : 'text-gray-800'}`}>
                {day.getDate()}
              </div>
            </div>
          );
        })}

        {/* Time rows */}
        {HOURS.map((hour) => (
          <>
            <div
              key={`time-${hour}`}
              className="border-b border-r text-xs text-gray-400 pr-1 text-right pt-1"
              style={{ height: `${slotHeight}px` }}
            >
              {hour.toString().padStart(2, '0')}:00
            </div>
            {days.map((day, di) => {
              const isToday = day.toDateString() === today.toDateString();
              const dayAppts = appointments.filter((a) => {
                const d = new Date(a.scheduledAt);
                return (
                  d.toDateString() === day.toDateString() &&
                  d.getHours() === hour
                );
              });
              return (
                <div
                  key={`cell-${hour}-${di}`}
                  className={`border-b border-r relative ${isToday ? 'bg-blue-50/30' : ''}`}
                  style={{ height: `${slotHeight}px` }}
                >
                  {dayAppts.map((appt) => (
                    <div
                      key={appt.id}
                      className={`absolute left-0.5 right-0.5 rounded border-l-2 px-1 text-xs overflow-hidden ${STATUS_COLORS[appt.status] ?? 'bg-blue-100 border-blue-400'}`}
                      style={getApptStyle(appt, slotHeight)}
                    >
                      <div className="font-medium truncate">{appt.patient.name}</div>
                      <div className="truncate text-[10px]">Dr. {appt.doctor.name}</div>
                    </div>
                  ))}
                </div>
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}
