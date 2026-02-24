import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ChangePasswordDialog } from '@/components/auth/ChangePasswordDialog';
import type { ApiResponse, User } from '@/types';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  doctor: 'Doctor',
  enfermera: 'Enfermera',
  recepcionista: 'Recepcionista',
  paciente: 'Paciente',
};

const profileSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  phone: z
    .string()
    .regex(/^\d{10}$/, 'El teléfono debe tener exactamente 10 dígitos')
    .optional()
    .or(z.literal('')),
  curp: z.string().length(18, 'El CURP debe tener exactamente 18 caracteres').optional(),
  rfc: z.string().length(13, 'El RFC debe tener exactamente 13 caracteres').optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export function ProfilePage() {
  const { user, setAuth, token } = useAuthStore();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? '',
      phone: user?.phone ?? '',
      curp: user?.curp ?? '',
      rfc: user?.rfc ?? '',
    },
  });

  function upperRegister(name: keyof ProfileForm) {
    const { onChange, ...rest } = register(name);
    return {
      ...rest,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        e.target.value = e.target.value.toUpperCase();
        return onChange(e);
      },
    };
  }

  const { onChange: onPhoneChange, ...phoneRest } = register('phone');
  const phoneInputProps = {
    ...phoneRest,
    inputMode: 'numeric' as const,
    maxLength: 10,
    placeholder: '10 dígitos',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
      return onPhoneChange(e);
    },
  };

  const mutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const res = await api.put<ApiResponse<User>>('/users/me', data);
      return res.data.data!;
    },
    onSuccess: (updatedUser) => {
      if (token) {
        setAuth(token, updatedUser);
      }
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-500 mt-1">Gestiona tu información personal y seguridad</p>
      </div>

      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle>Información personal</CardTitle>
          <CardDescription>Actualiza tu nombre y datos de contacto</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" value={user?.email ?? ''} disabled className="bg-gray-50" />
              <p className="text-xs text-gray-400">El correo no puede ser modificado</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" {...phoneInputProps} />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="curp">CURP</Label>
                <Input id="curp" maxLength={18} {...upperRegister('curp')} />
                {errors.curp && (
                  <p className="text-sm text-red-500">{errors.curp.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="rfc">RFC</Label>
                <Input id="rfc" maxLength={13} {...upperRegister('rfc')} />
                {errors.rfc && (
                  <p className="text-sm text-red-500">{errors.rfc.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Rol</Label>
              <div>
                <Badge variant="secondary">{ROLE_LABELS[user?.role ?? ''] ?? user?.role}</Badge>
              </div>
              <p className="text-xs text-gray-400">El rol es asignado por un administrador</p>
            </div>

            {saveSuccess && (
              <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3">
                <p className="text-sm text-green-700">Perfil actualizado exitosamente</p>
              </div>
            )}

            {mutation.isError && (
              <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm text-red-700">Error al guardar los cambios</p>
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={mutation.isPending || !isDirty}>
                {mutation.isPending ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle>Seguridad</CardTitle>
          <CardDescription>Gestiona tu contraseña de acceso</CardDescription>
        </CardHeader>
        <CardContent>
          <Separator className="mb-4" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Contraseña</p>
              <p className="text-sm text-gray-500">Cambia tu contraseña periódicamente</p>
            </div>
            <Button variant="outline" onClick={() => setChangePasswordOpen(true)}>
              Cambiar contraseña
            </Button>
          </div>
        </CardContent>
      </Card>

      <ChangePasswordDialog
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
        onSuccess={() => {}}
      />
    </div>
  );
}
