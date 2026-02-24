import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchAppointmentById } from '@/lib/appointments.api';
import { AppointmentCard } from '@/components/appointments/AppointmentCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: appointment, isLoading, isError } = useQuery({
    queryKey: ['appointment', id],
    queryFn: () => fetchAppointmentById(id!),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return <div className="text-gray-500 text-sm">Cargando cita...</div>;
  }

  if (isError || !appointment) {
    return <div className="text-red-500 text-sm">Cita no encontrada.</div>;
  }

  return (
    <div className="max-w-lg space-y-4">
      <Button variant="ghost" className="gap-2 -ml-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4" />
        Volver
      </Button>

      <h1 className="text-2xl font-bold text-gray-900">Detalle de Cita</h1>

      <AppointmentCard appointment={appointment} />
    </div>
  );
}
