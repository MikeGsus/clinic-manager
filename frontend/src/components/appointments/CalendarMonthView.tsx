import type { Appointment } from '@/types';

interface CalendarMonthViewProps {
  currentDate: Date;
  appointments: Appointment[];
  onDayClick: (date: Date) => void;
}

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-500',
  CONFIRMED: 'bg-green-500',
  CHECKED_IN: 'bg-teal-500',
  COMPLETED: 'bg-gray-400',
  CANCELLED: 'bg-red-400',
  NO_SHOW: 'bg-orange-400',
  RESCHEDULED: 'bg-purple-400',
};

export function CalendarMonthView({ currentDate, appointments, onDayClick }: CalendarMonthViewProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  // 6×7 grid — pad with nulls
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  function getAppointmentsForDay(day: number): Appointment[] {
    return appointments.filter((appt) => {
      const d = new Date(appt.scheduledAt);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  }

  const isToday = (day: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 bg-gray-50 border-b">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((d) => (
          <div key={d} className="py-2 text-center text-xs font-medium text-gray-500">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (!day) {
            return <div key={idx} className="h-28 border-b border-r bg-gray-50/50" />;
          }
          const dayAppts = getAppointmentsForDay(day);
          return (
            <div
              key={idx}
              className="h-28 border-b border-r p-1 cursor-pointer hover:bg-blue-50 transition-colors overflow-hidden"
              onClick={() => onDayClick(new Date(year, month, day))}
            >
              <span
                className={`inline-flex items-center justify-center w-6 h-6 text-sm rounded-full mb-1 ${
                  isToday(day) ? 'bg-blue-600 text-white font-bold' : 'text-gray-700'
                }`}
              >
                {day}
              </span>
              <div className="flex flex-col gap-0.5">
                {dayAppts.slice(0, 3).map((appt) => (
                  <div
                    key={appt.id}
                    className={`text-white text-xs px-1 rounded truncate ${STATUS_COLORS[appt.status] ?? 'bg-blue-400'}`}
                  >
                    {new Date(appt.scheduledAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City' })} {appt.patient.name}
                  </div>
                ))}
                {dayAppts.length > 3 && (
                  <div className="text-xs text-gray-500">+{dayAppts.length - 3} más</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
