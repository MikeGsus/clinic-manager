import { useState, useMemo, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { createAppointment, fetchDoctorSchedule } from '@/lib/appointments.api';
import { TimeSlotPicker } from './TimeSlotPicker';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import type { ApiResponse, Patient, User } from '@/types';

const schema = z.object({
  patientId: z.string().min(1, 'Selecciona un paciente'),
  doctorId: z.string().min(1, 'Selecciona un doctor'),
  date: z.date({ required_error: 'Selecciona una fecha' }),
  timeSlot: z.string().min(1, 'Selecciona un horario'),
  durationMins: z.number().int().positive(),
  type: z.enum(['CONSULTA', 'SEGUIMIENTO', 'URGENCIA', 'PROCEDIMIENTO', 'OTRO']),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface AppointmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppointmentForm({ open, onOpenChange }: AppointmentFormProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const isDoctor = user?.role === 'doctor';

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ['patients-list'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Patient[]>>('/patients');
      return res.data.data ?? [];
    },
    enabled: open,
  });

  const { data: doctors = [] } = useQuery<User[]>({
    queryKey: ['doctors-list'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<User[]>>('/users/doctors');
      return res.data.data ?? [];
    },
    enabled: open,
  });

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      durationMins: 30,
      type: 'CONSULTA',
      doctorId: isDoctor ? user!.id : '',
    },
  });

  const selectedDoctor = watch('doctorId');
  const selectedDate = watch('date');

  const { data: doctorSchedule = [] } = useQuery({
    queryKey: ['doctor-schedule-booking', selectedDoctor],
    queryFn: () => fetchDoctorSchedule(selectedDoctor),
    enabled: Boolean(selectedDoctor),
  });

  // Set of day-of-week indices (0=Sun … 6=Sat) that have no active schedule
  const disabledWeekdays = useMemo(() => {
    const inactive = new Set<number>();
    doctorSchedule.forEach((day, idx) => {
      if (!day || !day.isActive) inactive.add(idx);
    });
    return inactive;
  }, [doctorSchedule]);

  // Clear date and time slot when doctor changes (but not on first render)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setValue('date', undefined as any);
    setValue('timeSlot', '');
  }, [selectedDoctor]); // eslint-disable-line react-hooks/exhaustive-deps

  const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const [h, m] = values.timeSlot.split(':').map(Number);
      const scheduledAt = new Date(values.date);
      scheduledAt.setHours(h, m, 0, 0);

      return createAppointment({
        patientId: values.patientId,
        doctorId: values.doctorId,
        scheduledAt: scheduledAt.toISOString(),
        durationMins: values.durationMins,
        type: values.type,
        notes: values.notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({ description: 'Cita creada exitosamente' });
      reset({ durationMins: 30, type: 'CONSULTA', doctorId: isDoctor ? user!.id : '' });
      onOpenChange(false);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Error al crear la cita';
      toast({ variant: 'destructive', description: msg });
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Nueva Cita</SheetTitle>
        </SheetHeader>

        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="flex flex-col gap-4 mt-4 pb-4"
        >
          {/* Patient */}
          <div className="space-y-1.5">
            <Label>Paciente</Label>
            <Controller
              name="patientId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar paciente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.patientId && <p className="text-xs text-red-500">{errors.patientId.message}</p>}
          </div>

          {/* Doctor */}
          <div className="space-y-1.5">
            <Label>Doctor</Label>
            {isDoctor ? (
              <p className="text-sm font-medium px-3 py-2 rounded-md border bg-gray-50 text-gray-700">
                Dr. {user!.name}
              </p>
            ) : (
              <Controller
                name="doctorId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar doctor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          Dr. {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
            {errors.doctorId && <p className="text-xs text-red-500">{errors.doctorId.message}</p>}
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label>Fecha</Label>
            <Controller
              name="date"
              control={control}
              render={({ field }) => {
                const [calOpen, setCalOpen] = useState(false);
                return (
                  <Popover open={calOpen} onOpenChange={setCalOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        {field.value ? format(field.value, 'PPP', { locale: es }) : 'Seleccionar fecha'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => { field.onChange(date); setCalOpen(false); }}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                          (selectedDoctor ? disabledWeekdays.has(date.getDay()) : false)
                        }
                      />
                    </PopoverContent>
                  </Popover>
                );
              }}
            />
            {errors.date && <p className="text-xs text-red-500">{errors.date.message}</p>}
          </div>

          {/* Time slot */}
          <div className="space-y-1.5">
            <Label>Horario disponible</Label>
            <Controller
              name="timeSlot"
              control={control}
              render={({ field }) => (
                <TimeSlotPicker
                  doctorId={selectedDoctor}
                  date={dateStr}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.timeSlot && <p className="text-xs text-red-500">{errors.timeSlot.message}</p>}
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONSULTA">Consulta</SelectItem>
                    <SelectItem value="SEGUIMIENTO">Seguimiento</SelectItem>
                    <SelectItem value="URGENCIA">Urgencia</SelectItem>
                    <SelectItem value="PROCEDIMIENTO">Procedimiento</SelectItem>
                    <SelectItem value="OTRO">Otro</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Duration */}
          <div className="space-y-1.5">
            <Label>Duración</Label>
            <Controller
              name="durationMins"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={(v) => field.onChange(Number(v))}
                  value={String(field.value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutos</SelectItem>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="45">45 minutos</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Notas</Label>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <Textarea {...field} placeholder="Notas adicionales..." rows={3} />
              )}
            />
          </div>

          <SheetFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creando...' : 'Crear Cita'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
