import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ApiResponse, AuditLog } from '@/types';

interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

const ACTION_LABELS: Record<string, string> = {
  LOGIN_SUCCESS: 'Inicio de sesión',
  LOGIN_FAILED: 'Intento fallido',
  LOGOUT: 'Cierre de sesión',
  TOKEN_REFRESH: 'Renovación de token',
  PASSWORD_CHANGED: 'Contraseña cambiada',
  PASSWORD_RESET_REQUESTED: 'Reseteo solicitado',
  PASSWORD_RESET_COMPLETED: 'Reseteo completado',
  USER_CREATED: 'Usuario creado',
  USER_UPDATED: 'Usuario actualizado',
  USER_DEACTIVATED: 'Usuario desactivado',
  ROLE_CHANGED: 'Rol cambiado',
};

type BadgeVariant = 'default' | 'destructive' | 'outline' | 'secondary';

function getActionBadge(action: string): { variant: BadgeVariant; className: string } {
  if (['LOGIN_FAILED', 'USER_DEACTIVATED'].includes(action)) {
    return { variant: 'destructive', className: '' };
  }
  if (['PASSWORD_CHANGED', 'PASSWORD_RESET_REQUESTED', 'PASSWORD_RESET_COMPLETED', 'ROLE_CHANGED'].includes(action)) {
    return { variant: 'outline', className: 'border-yellow-400 text-yellow-700' };
  }
  if (['LOGIN_SUCCESS', 'USER_CREATED'].includes(action)) {
    return { variant: 'outline', className: 'border-green-400 text-green-700' };
  }
  return { variant: 'secondary', className: '' };
}

const ALL_ACTIONS = Object.keys(ACTION_LABELS);

export function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, actionFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (actionFilter !== 'all') params.set('action', actionFilter);
      const res = await api.get<ApiResponse<AuditLogsResponse>>(`/auth/audit-logs?${params}`);
      return res.data.data!;
    },
  });

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registros de Auditoría</h1>
          <p className="text-gray-500 mt-1">Historial de eventos del sistema</p>
        </div>
        <div className="w-56">
          <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por acción" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las acciones</SelectItem>
              {ALL_ACTIONS.map((a) => (
                <SelectItem key={a} value={a}>
                  {ACTION_LABELS[a]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="rounded-lg border bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha y hora</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Entidad</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.logs ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-gray-400">
                      No hay registros de auditoría
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.logs.map((log) => {
                    const badge = getActionBadge(log.action);
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString('es-MX')}
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.user ? (
                            <div>
                              <div className="font-medium">{log.user.name}</div>
                              <div className="text-gray-400 text-xs">{log.user.email}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">Sistema</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={badge.variant} className={badge.className}>
                            {ACTION_LABELS[log.action] ?? log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {log.entity ? `${log.entity}` : '—'}
                        </TableCell>
                        <TableCell className="text-sm text-gray-400 font-mono">
                          {log.ipAddress ?? '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Mostrando {((page - 1) * limit) + 1}–{Math.min(page * limit, data?.total ?? 0)} de {data?.total ?? 0}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm px-3 py-1.5 border rounded">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
