import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fetchDoctorSchedule, upsertScheduleDay } from '@/lib/appointments.api';
import { useToast } from '@/hooks/use-toast';
import type { ScheduleDay } from '@/types';

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

interface DayState {
  isActive: boolean;
  startTime: string;
  endTime: string;
  slotDuration: number;
}

const DEFAULT_DAY: DayState = {
  isActive: false,
  startTime: '08:00',
  endTime: '18:00',
  slotDuration: 30,
};

interface WeeklyScheduleEditorProps {
  doctorId?: string;
}

export function WeeklyScheduleEditor({ doctorId }: WeeklyScheduleEditorProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: schedule = Array(7).fill(null), isLoading } = useQuery<(ScheduleDay | null)[]>({
    queryKey: ['doctor-schedule', doctorId],
    queryFn: () => fetchDoctorSchedule(doctorId),
  });

  const [localState, setLocalState] = useState<DayState[]>(() =>
    Array(7).fill(null).map((_, i) => {
      const s = schedule[i];
      return s ? { isActive: s.isActive, startTime: s.startTime, endTime: s.endTime, slotDuration: s.slotDuration } : { ...DEFAULT_DAY };
    })
  );

  const upsertMutation = useMutation({
    mutationFn: (data: DayState & { dayOfWeek: number }) =>
      upsertScheduleDay({ ...data, doctorId }),
    onError: () => toast({ variant: 'destructive', description: 'Error al guardar' }),
  });

  function updateDay(day: number, partial: Partial<DayState>) {
    setLocalState((prev) => prev.map((s, i) => (i === day ? { ...s, ...partial } : s)));
  }

  async function saveAll() {
    await Promise.all(
      localState.map((day, dayOfWeek) => upsertMutation.mutateAsync({ ...day, dayOfWeek }))
    );
    queryClient.invalidateQueries({ queryKey: ['doctor-schedule', doctorId] });
    toast({ description: 'Horario guardado' });
  }

  if (isLoading) return <p className="text-sm text-gray-400">Cargando horarios...</p>;

  return (
    <div className="space-y-3">
      {Array(7).fill(null).map((_, dayIdx) => {
        const day = localState[dayIdx];
        return (
          <div
            key={dayIdx}
            className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
              day.isActive ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 bg-gray-50/50'
            }`}
          >
            {/* Day toggle */}
            <div className="flex items-center gap-2 w-36 shrink-0">
              <Switch
                checked={day.isActive}
                onCheckedChange={(v) => updateDay(dayIdx, { isActive: v })}
              />
              <span className={`text-sm font-medium ${day.isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                {DAY_NAMES[dayIdx]}
              </span>
            </div>

            {/* Times */}
            <div className={`flex items-center gap-2 flex-1 ${!day.isActive ? 'opacity-40 pointer-events-none' : ''}`}>
              <Input
                type="time"
                value={day.startTime}
                onChange={(e) => updateDay(dayIdx, { startTime: e.target.value })}
                className="w-28"
              />
              <span className="text-gray-400 text-sm">–</span>
              <Input
                type="time"
                value={day.endTime}
                onChange={(e) => updateDay(dayIdx, { endTime: e.target.value })}
                className="w-28"
              />

              <Select
                value={String(day.slotDuration)}
                onValueChange={(v) => updateDay(dayIdx, { slotDuration: Number(v) })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">60 min</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      })}

      <div className="flex justify-end pt-2">
        <Button onClick={saveAll} disabled={upsertMutation.isPending}>
          {upsertMutation.isPending ? 'Guardando...' : 'Guardar horario'}
        </Button>
      </div>
    </div>
  );
}
