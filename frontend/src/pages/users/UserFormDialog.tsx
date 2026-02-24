import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ApiResponse, User } from '@/types';

const createSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Correo inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  role: z.enum(['admin', 'doctor', 'enfermera', 'recepcionista', 'paciente']),
  phone: z.string().optional(),
  curp: z.string().length(18, 'El CURP debe tener exactamente 18 caracteres').optional(),
  rfc: z.string().length(13, 'El RFC debe tener exactamente 13 caracteres').optional(),
});

const editSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  role: z.enum(['admin', 'doctor', 'enfermera', 'recepcionista', 'paciente']),
  phone: z.string().optional(),
  curp: z.string().length(18, 'El CURP debe tener exactamente 18 caracteres').optional(),
  rfc: z.string().length(13, 'El RFC debe tener exactamente 13 caracteres').optional(),
});

const ROLES = [
  { value: 'admin', label: 'Administrador' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'enfermera', label: 'Enfermera' },
  { value: 'recepcionista', label: 'Recepcionista' },
  { value: 'paciente', label: 'Paciente' },
] as const;

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User;
}

export function UserFormDialog({ open, onOpenChange, user }: UserFormDialogProps) {
  const queryClient = useQueryClient();
  const isEdit = !!user;

  const schema = isEdit ? editSchema : createSchema;
  type FormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name ?? '',
      ...(isEdit ? {} : { email: '', password: '' }),
      role: user?.role ?? 'recepcionista',
      phone: user?.phone ?? '',
    },
  });

  const roleValue = watch('role');

  // Wraps a register result so the field only accepts digits and is capped at 10
  function phoneRegister(name: keyof FormData) {
    const { onChange, ...rest } = register(name);
    return {
      ...rest,
      inputMode: 'numeric' as const,
      maxLength: 10,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
        return onChange(e);
      },
    };
  }

  // Wraps a register result so the field value is uppercased on every keystroke
  function upperRegister(name: keyof FormData) {
    const { onChange, ...rest } = register(name);
    return {
      ...rest,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        e.target.value = e.target.value.toUpperCase();
        return onChange(e);
      },
    };
  }

  // Re-populate form whenever the dialog opens or the target user changes
  useEffect(() => {
    if (open) {
      reset({
        name: user?.name ?? '',
        role: user?.role ?? 'recepcionista',
        phone: user?.phone ?? '',
        curp: user?.curp ?? '',
        rfc: user?.rfc ?? '',
        ...(!isEdit ? { email: '', password: '' } : {}),
      } as FormData);
    }
  }, [open, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (isEdit) {
        const res = await api.put<ApiResponse<User>>(`/users/${user.id}`, data);
        return res.data.data!;
      } else {
        const res = await api.post<ApiResponse<User>>('/users', data);
        return res.data.data!;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      reset();
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      const data = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })
        ?.response?.data;

      // Map field-level errors (e.g. curp, rfc, email) directly to the form
      if (data?.errors) {
        let hasMappedField = false;
        for (const [field, messages] of Object.entries(data.errors)) {
          setError(field as keyof FormData, { message: messages[0] });
          hasMappedField = true;
        }
        if (hasMappedField) return;
      }

      setError('root', { message: data?.message ?? 'Error al guardar el usuario' });
    },
  });

  function handleClose(open: boolean) {
    if (!open) reset();
    onOpenChange(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Modifica la información del usuario'
              : 'Completa los datos para crear un nuevo usuario'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">Nombre completo *</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            {!isEdit && (
              <>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="email">Correo electrónico *</Label>
                  <Input id="email" type="email" {...register('email' as keyof FormData)} />
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(errors as any).email && (
                    <p className="text-sm text-red-500">{(errors as any).email.message}</p>
                  )}
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="password">Contraseña *</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    {...register('password' as keyof FormData)}
                  />
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(errors as any).password && (
                    <p className="text-sm text-red-500">{(errors as any).password.message}</p>
                  )}
                </div>
              </>
            )}

            <div className="col-span-2 space-y-2">
              <Label>Rol *</Label>
              <Select
                value={roleValue}
                onValueChange={(v) => setValue('role', v as FormData['role'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role && <p className="text-sm text-red-500">{errors.role.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" placeholder="10 dígitos" {...phoneRegister('phone')} />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="curp">CURP</Label>
              <Input id="curp" maxLength={18} {...upperRegister('curp')} />
              {(errors as any).curp && (
                <p className="text-sm text-red-500">{(errors as any).curp.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rfc">RFC</Label>
              <Input id="rfc" maxLength={13} {...upperRegister('rfc')} />
              {(errors as any).rfc && (
                <p className="text-sm text-red-500">{(errors as any).rfc.message}</p>
              )}
            </div>
          </div>

          {errors.root && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-sm text-red-700">{errors.root.message}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              {mutation.isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear usuario'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
