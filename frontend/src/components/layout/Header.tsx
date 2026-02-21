import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChangePasswordDialog } from '@/components/auth/ChangePasswordDialog';
import api from '@/lib/api';
import { User, KeyRound, LogOut } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  doctor: 'Doctor',
  enfermera: 'Enfermera',
  recepcionista: 'Recepcionista',
  paciente: 'Paciente',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  async function handleLogout() {
    try {
      await api.post('/auth/logout');
    } finally {
      logout();
      navigate('/login');
    }
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div />

      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-medium">
                  {user?.name ? getInitials(user.name) : <User className="w-4 h-4" />}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-0.5">
                <span className="font-medium text-gray-900">{user?.name}</span>
                <span className="text-xs font-normal text-gray-500">
                  {user?.role ? ROLE_LABELS[user.role] : ''}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => navigate('/profile')} className="gap-2 cursor-pointer">
              <User className="w-4 h-4" />
              Mi Perfil
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => setChangePasswordOpen(true)}
              className="gap-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              Cambiar contraseña
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleLogout}
              className="gap-2 cursor-pointer text-red-600 focus:text-red-600"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ChangePasswordDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
    </header>
  );
}
