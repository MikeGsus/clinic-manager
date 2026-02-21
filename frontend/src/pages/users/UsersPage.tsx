import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { UserPlus, Pencil, UserX, UserCheck } from 'lucide-react';
import { UserFormDialog } from './UserFormDialog';
import type { ApiResponse, User } from '@/types';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  doctor: 'Doctor',
  enfermera: 'Enfermera',
  recepcionista: 'Recepcionista',
  paciente: 'Paciente',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800',
  doctor: 'bg-blue-100 text-blue-800',
  enfermera: 'bg-green-100 text-green-800',
  recepcionista: 'bg-yellow-100 text-yellow-800',
  paciente: 'bg-gray-100 text-gray-800',
};

export function UsersPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | undefined>(undefined);
  const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<User[]>>('/users');
      return res.data.data ?? [];
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (user: User) => {
      if (user.active) {
        await api.delete(`/users/${user.id}`);
      } else {
        await api.put(`/users/${user.id}`, { active: true });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeactivateTarget(null);
    },
  });

  function handleEdit(user: User) {
    setEditUser(user);
    setFormOpen(true);
  }

  function handleNew() {
    setEditUser(undefined);
    setFormOpen(true);
  }

  function handleFormClose(open: boolean) {
    setFormOpen(open);
    if (!open) setEditUser(undefined);
  }

  const users = data ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-500 mt-1">Gestión de cuentas del sistema</p>
        </div>
        <Button onClick={handleNew} className="gap-2">
          <UserPlus className="w-4 h-4" />
          Nuevo usuario
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">No hay usuarios registrados</p>
          <p className="text-sm mt-1">Crea el primer usuario con el botón de arriba</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-gray-500">{user.email}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS[user.role] ?? 'bg-gray-100 text-gray-800'}`}
                    >
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.active ? 'default' : 'destructive'}>
                      {user.active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {new Date(user.createdAt).toLocaleDateString('es-MX')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(user)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeactivateTarget(user)}
                        className={`h-8 w-8 p-0 ${user.active ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-800'}`}
                      >
                        {user.active ? (
                          <UserX className="w-4 h-4" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <UserFormDialog open={formOpen} onOpenChange={handleFormClose} user={editUser} />

      <AlertDialog
        open={!!deactivateTarget}
        onOpenChange={(o) => !o && setDeactivateTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deactivateTarget?.active ? '¿Desactivar usuario?' : '¿Activar usuario?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deactivateTarget?.active
                ? `El usuario "${deactivateTarget?.name}" perderá acceso al sistema.`
                : `El usuario "${deactivateTarget?.name}" recuperará acceso al sistema.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deactivateTarget && toggleActiveMutation.mutate(deactivateTarget)}
              className={deactivateTarget?.active ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {deactivateTarget?.active ? 'Desactivar' : 'Activar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
