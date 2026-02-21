import { useAuthStore } from '@/store/auth.store';
import { Users, UserCircle, Calendar, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  doctor: 'Doctor',
  enfermera: 'Enfermera',
  recepcionista: 'Recepcionista',
  paciente: 'Paciente',
};

export function Dashboard() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenido, {user?.name}
        </h1>
        <p className="text-gray-500 mt-1">
          Rol: {user?.role ? ROLE_LABELS[user.role] : '—'}
        </p>
      </div>

      {/* Stats cards - placeholder data */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {user?.role !== 'paciente' && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pacientes</CardTitle>
                <UserCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">—</div>
                <p className="text-xs text-muted-foreground">Total activos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Citas hoy</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">—</div>
                <p className="text-xs text-muted-foreground">Programadas</p>
              </CardContent>
            </Card>
          </>
        )}

        {user?.role === 'admin' && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">—</div>
                <p className="text-xs text-muted-foreground">Personal activo</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sistema</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Online</div>
                <p className="text-xs text-muted-foreground">Estado operativo</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Info card */}
      <Card>
        <CardHeader>
          <CardTitle>Sistema de Gestión Clínica</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-sm">
            Bienvenido al sistema de gestión de la clínica. Usa el menú lateral para navegar entre las
            secciones disponibles según tu rol.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
