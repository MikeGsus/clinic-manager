import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { fetchAppointments } from '@/lib/appointments.api';
import type { Appointment } from '@/types';
import { CalendarMonthView } from './CalendarMonthView';
import { CalendarWeekView } from './CalendarWeekView';
import { CalendarDayView } from './CalendarDayView';

interface AppointmentCalendarProps {
  onNewAppointment: () => void;
}

export function AppointmentCalendar({ onNewAppointment }: AppointmentCalendarProps) {
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ['appointments'],
    queryFn: () => fetchAppointments(),
  });

  function navigate(direction: 'prev' | 'next') {
    const d = new Date(currentDate);
    if (view === 'month') {
      d.setMonth(d.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (view === 'week') {
      d.setDate(d.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      d.setDate(d.getDate() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(d);
  }

  function formatTitle() {
    const locale = 'es-MX';
    if (view === 'month') {
      return currentDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
    }
    if (view === 'week') {
      const start = new Date(currentDate);
      start.setDate(start.getDate() - start.getDay());
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return `${start.toLocaleDateString(locale, { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    return currentDate.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate('prev')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-semibold capitalize min-w-[220px] text-center">{formatTitle()}</h2>
          <Button variant="outline" size="icon" onClick={() => navigate('next')}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Hoy
          </Button>
        </div>
        <Button onClick={onNewAppointment} className="gap-2">
          <Plus className="w-4 h-4" />
          Nueva Cita
        </Button>
      </div>

      {/* View tabs */}
      <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
        <TabsList>
          <TabsTrigger value="month">Mes</TabsTrigger>
          <TabsTrigger value="week">Semana</TabsTrigger>
          <TabsTrigger value="day">Día</TabsTrigger>
        </TabsList>

        <TabsContent value="month" className="mt-4">
          <CalendarMonthView
            currentDate={currentDate}
            appointments={appointments}
            onDayClick={(date) => { setCurrentDate(date); setView('day'); }}
          />
        </TabsContent>

        <TabsContent value="week" className="mt-4">
          <CalendarWeekView
            currentDate={currentDate}
            appointments={appointments}
          />
        </TabsContent>

        <TabsContent value="day" className="mt-4">
          <CalendarDayView
            currentDate={currentDate}
            appointments={appointments}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
