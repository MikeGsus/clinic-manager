import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WeeklyScheduleEditor } from '@/components/schedule/WeeklyScheduleEditor';
import { fetchExceptions, createException, deleteException } from '@/lib/appointments.api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function DoctorSchedulePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [exceptionOpen, setExceptionOpen] = useState(false);

  const { data: exceptions = [] } = useQuery({
    queryKey: ['exceptions'],
    queryFn: () => fetchExceptions(),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteException,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exceptions'] });
      toast({ description: 'Excepción eliminada' });
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi Horario</h1>
        <p className="text-sm text-gray-500 mt-1">Configura tu disponibilidad semanal</p>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-4">Horario semanal</h2>
        <WeeklyScheduleEditor />
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Excepciones</h2>
          <Button size="sm" className="gap-2" onClick={() => setExceptionOpen(true)}>
            <Plus className="w-4 h-4" />
            Agregar
          </Button>
        </div>

        {exceptions.length === 0 ? (
          <p className="text-sm text-gray-400">Sin excepciones configuradas</p>
        ) : (
          <div className="border rounded-lg divide-y">
            {exceptions.map((ex) => (
              <div key={ex.id} className="flex items-center justify-between p-3">
                <div>
                  <span className="font-medium text-sm">
                    {new Date(ex.date).toLocaleDateString('es-MX', { dateStyle: 'medium' })}
                  </span>
                  {ex.isBlocked ? (
                    <Badge variant="destructive" className="ml-2 text-xs">Día bloqueado</Badge>
                  ) : (
                    <Badge variant="outline" className="ml-2 text-xs">
                      {ex.startTime} – {ex.endTime}
                    </Badge>
                  )}
                  {ex.reason && <p className="text-xs text-gray-500 mt-0.5">{ex.reason}</p>}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:bg-red-50"
                  onClick={() => deleteMutation.mutate(ex.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <AddExceptionDialog
        open={exceptionOpen}
        onOpenChange={setExceptionOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['exceptions'] });
          toast({ description: 'Excepción creada' });
          setExceptionOpen(false);
        }}
      />
    </div>
  );
}

function AddExceptionDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [date, setDate] = useState('');
  const [isBlocked, setIsBlocked] = useState(true);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('18:00');
  const [reason, setReason] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      createException({
        date: new Date(date).toISOString(),
        isBlocked,
        startTime: isBlocked ? undefined : startTime,
        endTime: isBlocked ? undefined : endTime,
        reason: reason || undefined,
      }),
    onSuccess: () => {
      setDate('');
      setReason('');
      onSuccess();
    },
    onError: (err: any) => {
      toast({ variant: 'destructive', description: err?.response?.data?.message ?? 'Error' });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Agregar excepción</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Fecha</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={isBlocked} onCheckedChange={setIsBlocked} />
            <Label>{isBlocked ? 'Día bloqueado (no disponible)' : 'Horario personalizado'}</Label>
          </div>

          {!isBlocked && (
            <div className="flex items-center gap-2">
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-32" />
              <span className="text-gray-400">–</span>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-32" />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Motivo (opcional)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Vacaciones, congreso, etc."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => mutation.mutate()} disabled={!date || mutation.isPending}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
