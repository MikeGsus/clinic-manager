import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchAppointmentByQR, checkIn } from '@/lib/appointments.api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useState } from 'react';

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Programada',
  CONFIRMED: 'Confirmada',
  CHECKED_IN: 'Check-in realizado',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
  NO_SHOW: 'No asistió',
  RESCHEDULED: 'Reagendada',
};

export function CheckInPage() {
  const { token } = useParams<{ token: string }>();
  const { user } = useAuthStore();
  const [done, setDone] = useState(false);

  const { data: appointment, isLoading, isError } = useQuery({
    queryKey: ['checkin-appt', token],
    queryFn: () => fetchAppointmentByQR(token!),
    enabled: Boolean(token),
  });

  const checkInMutation = useMutation({
    mutationFn: () => checkIn(token!),
    onSuccess: () => setDone(true),
  });

  const canCheckIn =
    user && ['admin', 'enfermera', 'recepcionista'].includes(user.role);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Verificando cita...</p>
      </div>
    );
  }

  if (isError || !appointment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <XCircle className="w-16 h-16 text-red-400 mx-auto" />
          <h1 className="text-xl font-bold text-gray-800">Cita no encontrada</h1>
          <p className="text-gray-500">El código QR no corresponde a ninguna cita válida.</p>
        </div>
      </div>
    );
  }

  if (done || appointment.status === 'CHECKED_IN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm mx-auto px-4">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900">¡Check-in Exitoso!</h1>
          <p className="text-gray-600">El paciente ha sido registrado. Por favor toma asiento.</p>
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-left space-y-1">
            <p><span className="text-gray-500">Paciente:</span> <strong>{appointment.patient.name}</strong></p>
            <p><span className="text-gray-500">Doctor:</span> Dr. {appointment.doctor.name}</p>
            <p>
              <span className="text-gray-500">Hora:</span>{' '}
              {new Date(appointment.scheduledAt).toLocaleString('es-MX', {
                timeZone: 'America/Mexico_City',
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (appointment.status === 'CANCELLED') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <XCircle className="w-16 h-16 text-red-400 mx-auto" />
          <h1 className="text-xl font-bold text-gray-800">Cita Cancelada</h1>
          <p className="text-gray-500">{appointment.cancellationReason ?? 'Esta cita ha sido cancelada.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-sm w-full mx-4 bg-white rounded-xl shadow-sm border p-6 space-y-5">
        <div className="text-center">
          <Clock className="w-12 h-12 text-blue-500 mx-auto mb-2" />
          <h1 className="text-xl font-bold text-gray-900">Cita Médica</h1>
          <Badge variant="outline" className="mt-1">
            {STATUS_LABELS[appointment.status] ?? appointment.status}
          </Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Paciente</span>
            <span className="font-medium">{appointment.patient.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Doctor</span>
            <span>Dr. {appointment.doctor.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Fecha y hora</span>
            <span>
              {new Date(appointment.scheduledAt).toLocaleString('es-MX', {
                timeZone: 'America/Mexico_City',
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Duración</span>
            <span>{appointment.durationMins} minutos</span>
          </div>
        </div>

        {canCheckIn ? (
          <Button
            className="w-full"
            size="lg"
            onClick={() => checkInMutation.mutate()}
            disabled={checkInMutation.isPending}
          >
            {checkInMutation.isPending ? 'Procesando...' : 'Confirmar Check-in'}
          </Button>
        ) : !user ? (
          <p className="text-center text-sm text-gray-400">
            Inicia sesión como recepcionista para confirmar el check-in
          </p>
        ) : (
          <p className="text-center text-sm text-gray-400">
            Solo recepcionistas y enfermeras pueden confirmar el check-in
          </p>
        )}
      </div>
    </div>
  );
}
