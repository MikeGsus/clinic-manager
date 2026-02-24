import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, QrCode, XCircle } from 'lucide-react';
import type { Appointment } from '@/types';
import { cancelAppointment, checkIn } from '@/lib/appointments.api';
import { CancelDialog } from './CancelDialog';
import { QRCodeDisplay } from './QRCodeDisplay';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/hooks/use-toast';

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Programada',
  CONFIRMED: 'Confirmada',
  CHECKED_IN: 'En consulta',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
  NO_SHOW: 'No asistió',
  RESCHEDULED: 'Reagendada',
};

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  SCHEDULED: 'default',
  CONFIRMED: 'default',
  CHECKED_IN: 'default',
  COMPLETED: 'secondary',
  CANCELLED: 'destructive',
  NO_SHOW: 'destructive',
  RESCHEDULED: 'secondary',
};

const TYPE_LABELS: Record<string, string> = {
  CONSULTA: 'Consulta',
  SEGUIMIENTO: 'Seguimiento',
  URGENCIA: 'Urgencia',
  PROCEDIMIENTO: 'Procedimiento',
  OTRO: 'Otro',
};

interface AppointmentCardProps {
  appointment: Appointment;
  onClose?: () => void;
}

export function AppointmentCard({ appointment: appt, onClose }: AppointmentCardProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const cancelMutation = useMutation({
    mutationFn: ({ reason }: { reason?: string }) => cancelAppointment(appt.id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({ description: 'Cita cancelada' });
      setCancelOpen(false);
    },
    onError: () => toast({ variant: 'destructive', description: 'Error al cancelar' }),
  });

  const checkInMutation = useMutation({
    mutationFn: () => checkIn(appt.qrToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({ description: 'Check-in realizado' });
    },
    onError: () => toast({ variant: 'destructive', description: 'Error al hacer check-in' }),
  });

  const canCancel =
    !['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(appt.status) &&
    ['admin', 'recepcionista', 'doctor', 'paciente'].includes(user?.role ?? '');

  const canCheckIn =
    ['SCHEDULED', 'CONFIRMED'].includes(appt.status) &&
    ['admin', 'enfermera', 'recepcionista'].includes(user?.role ?? '');

  return (
    <div className="bg-white border rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Badge variant={STATUS_VARIANTS[appt.status] ?? 'default'}>
            {STATUS_LABELS[appt.status] ?? appt.status}
          </Badge>
          <Badge variant="outline" className="ml-2 text-xs">
            {TYPE_LABELS[appt.type] ?? appt.type}
          </Badge>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Details */}
      <div className="space-y-1 text-sm">
        <div>
          <span className="text-gray-500">Paciente: </span>
          <span className="font-medium">{appt.patient.name}</span>
        </div>
        <div>
          <span className="text-gray-500">Doctor: </span>
          <span>Dr. {appt.doctor.name}</span>
        </div>
        <div>
          <span className="text-gray-500">Fecha: </span>
          <span>
            {new Date(appt.scheduledAt).toLocaleString('es-MX', {
              timeZone: 'America/Mexico_City',
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Duración: </span>
          <span>{appt.durationMins} min</span>
        </div>
        {appt.notes && (
          <div>
            <span className="text-gray-500">Notas: </span>
            <span>{appt.notes}</span>
          </div>
        )}
        {appt.cancellationReason && (
          <div>
            <span className="text-gray-500">Motivo cancelación: </span>
            <span className="text-red-600">{appt.cancellationReason}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => setQrOpen(true)}
        >
          <QrCode className="w-4 h-4" />
          QR
        </Button>

        {canCheckIn && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1 text-teal-700 border-teal-300 hover:bg-teal-50"
            onClick={() => checkInMutation.mutate()}
            disabled={checkInMutation.isPending}
          >
            Check-in
          </Button>
        )}

        {canCancel && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1 text-red-600 border-red-300 hover:bg-red-50"
            onClick={() => setCancelOpen(true)}
          >
            <XCircle className="w-4 h-4" />
            Cancelar
          </Button>
        )}
      </div>

      <CancelDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        onConfirm={(reason) => cancelMutation.mutate({ reason })}
      />

      <QRCodeDisplay appointment={appt} open={qrOpen} onOpenChange={setQrOpen} />
    </div>
  );
}
