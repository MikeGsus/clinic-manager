import { NavLink } from 'react-router-dom';
import { Users, UserCircle, LayoutDashboard, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import type { Role } from '@/types';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
}

const ALL_ROLES: Role[] = ['admin', 'doctor', 'enfermera', 'recepcionista', 'paciente'];

const NAV_ITEMS: NavItem[] = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ALL_ROLES,
  },
  {
    to: '/patients',
    label: 'Pacientes',
    icon: UserCircle,
    roles: ['admin', 'doctor', 'enfermera', 'recepcionista'],
  },
  {
    to: '/users',
    label: 'Usuarios',
    icon: Users,
    roles: ['admin'],
  },
  {
    to: '/profile',
    label: 'Mi Perfil',
    icon: UserCircle,
    roles: ALL_ROLES,
  },
  {
    to: '/admin/audit-logs',
    label: 'Auditoría',
    icon: Shield,
    roles: ['admin'],
  },
];

export function Sidebar() {
  const { user } = useAuthStore();
  const role = user?.role;

  const visibleItems = NAV_ITEMS.filter((item) => role && item.roles.includes(role));

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <span className="font-semibold text-gray-900">Clínica Manager</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
