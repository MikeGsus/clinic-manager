import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWaitingList, addToWaitingList, removeFromWaitingList } from '@/lib/appointments.api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm, Controller } from 'react-hook-form';
import api from '@/lib/api';
import type { ApiResponse, Patient, User } from '@/types';

export function WaitingListPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['waiting-list'],
    queryFn: fetchWaitingList,
  });

  const removeMutation = useMutation({
    mutationFn: removeFromWaitingList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiting-list'] });
      toast({ description: 'Eliminado de lista de espera' });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Lista de Espera</h1>
        <Button className="gap-2" onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4" />
          Agregar
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-400">Cargando...</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-gray-400">La lista de espera está vacía.</p>
      ) : (
        <div className="border rounded-lg divide-y">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between p-4">
              <div className="space-y-0.5">
                <p className="font-medium">{entry.patient.name}</p>
                <p className="text-sm text-gray-500">
                  {entry.doctor ? `Dr. ${entry.doctor.name}` : 'Cualquier doctor'}
                  {entry.preferredDate && (
                    <> · Prefiere: {new Date(entry.preferredDate).toLocaleDateString('es-MX')}</>
                  )}
                </p>
                {entry.notes && <p className="text-xs text-gray-400">{entry.notes}</p>}
                {entry.notifiedAt && (
                  <Badge variant="outline" className="text-xs">
                    Notificado {new Date(entry.notifiedAt).toLocaleDateString('es-MX')}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-red-500 hover:bg-red-50"
                onClick={() => removeMutation.mutate(entry.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <AddToWaitingListSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['waiting-list'] });
          toast({ description: 'Agregado a lista de espera' });
          setAddOpen(false);
        }}
      />
    </div>
  );
}

interface AddFormValues {
  patientId: string;
  doctorId?: string;
  notes?: string;
}

function AddToWaitingListSheet({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();

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

  const { control, handleSubmit, reset } = useForm<AddFormValues>();

  const mutation = useMutation({
    mutationFn: (data: AddFormValues) => addToWaitingList(data),
    onSuccess: () => {
      reset();
      onSuccess();
    },
    onError: () => toast({ variant: 'destructive', description: 'Error al agregar' }),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Agregar a Lista de Espera</SheetTitle>
        </SheetHeader>

        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="flex flex-col gap-4 mt-4"
        >
          <div className="space-y-1.5">
            <Label>Paciente</Label>
            <Controller
              name="patientId"
              control={control}
              rules={{ required: true }}
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
          </div>

          <div className="space-y-1.5">
            <Label>Doctor preferido (opcional)</Label>
            <Controller
              name="doctorId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Cualquier doctor" />
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
          </div>

          <div className="space-y-1.5">
            <Label>Notas</Label>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <Textarea {...field} placeholder="Urgencia, motivo, etc." rows={3} />
              )}
            />
          </div>

          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              Agregar
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
