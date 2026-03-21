import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ListChecks, Plus, Settings,
  CheckSquare, X, LogOut,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getInitials } from '../../utils/auth';
import { cn } from '../../utils/cn';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks',     icon: ListChecks,      label: 'Mis Tareas' },
  { to: '/settings',  icon: Settings,        label: 'Configuración' },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { currentUser, logout } = useAuthStore();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={onClose} />
      )}

      <aside className={cn(
        'fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 flex flex-col',
        'transition-transform duration-300',
        'lg:translate-x-0 lg:static lg:z-auto',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <CheckSquare size={18} className="text-white" />
            </div>
            <span className="font-bold text-white text-lg">TaskMaster</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* New task shortcut */}
        <div className="px-4 py-4">
          <NavLink to="/tasks/new"
            className="flex items-center gap-2 w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
            onClick={onClose}>
            <Plus size={16} /> Nueva Tarea
          </NavLink>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 pb-4 space-y-1">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={onClose}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}>
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {currentUser ? getInitials(currentUser.name) : '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{currentUser?.name}</p>
              <p className="text-slate-400 text-xs truncate">{currentUser?.email}</p>
            </div>
            <button onClick={logout} title="Cerrar sesión"
              className="text-slate-400 hover:text-red-400 transition-colors flex-shrink-0">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
