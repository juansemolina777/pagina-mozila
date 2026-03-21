import { Menu, Bell, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const TITLES: Record<string, string> = {
  '/dashboard':  'Dashboard',
  '/tasks':      'Mis Tareas',
  '/tasks/new':  'Nueva Tarea',
  '/settings':   'Configuración',
};

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { pathname } = useLocation();
  const title = TITLES[pathname] ?? 'TaskMaster';

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-4">
      <button onClick={onMenuClick}
        className="lg:hidden text-slate-500 hover:text-slate-900 transition-colors">
        <Menu size={22} />
      </button>

      <h1 className="text-lg font-semibold text-slate-900 flex-1">{title}</h1>

      <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 text-slate-400 text-sm w-52">
        <Search size={15} />
        <span>Buscar...</span>
      </div>

      <button className="relative text-slate-500 hover:text-slate-900 transition-colors">
        <Bell size={20} />
      </button>
    </header>
  );
}
