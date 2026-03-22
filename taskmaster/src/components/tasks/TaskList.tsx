import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ClipboardList, LayoutGrid, List } from 'lucide-react';
import { useTaskStore } from '../../store/taskStore';
import { useAuthStore } from '../../store/authStore';
import TaskCard from './TaskCard';
import TaskFilters from './TaskFilters';
import KanbanBoard from './KanbanBoard';
import { cn } from '../../utils/cn';
import AdBanner from '../ui/AdBanner';

type ViewMode = 'list' | 'kanban';

export default function TaskList() {
  const { currentUser } = useAuthStore();
  const { getFilteredTasks, getTasksByUser } = useTaskStore();
  const [view, setView] = useState<ViewMode>('list');

  if (!currentUser) return null;

  const filtered = getFilteredTasks(currentUser.id);
  const total    = getTasksByUser(currentUser.id).length;

  return (
    <div className="space-y-4">
      <TaskFilters />

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {filtered.length === total
            ? `${total} tarea${total !== 1 ? 's' : ''}`
            : `${filtered.length} de ${total} tareas`}
        </p>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => setView('list')}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                view === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'
              )}
              title="Vista lista"
            >
              <List size={15} />
            </button>
            <button
              onClick={() => setView('kanban')}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                view === 'kanban' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'
              )}
              title="Vista Kanban"
            >
              <LayoutGrid size={15} />
            </button>
          </div>

          <Link
            to="/tasks/new"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
          >
            <Plus size={15} /> Nueva tarea
          </Link>
        </div>
      </div>

      {/* Ad banner */}
      <AdBanner slot="7703659062" format="horizontal" className="rounded-xl overflow-hidden" />

      {/* Content */}
      {view === 'kanban' ? (
        <KanbanBoard />
      ) : (
        <>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <ClipboardList size={28} className="text-slate-400" />
              </div>
              <h3 className="text-slate-700 font-medium mb-1">
                {total === 0 ? '¡Crea tu primera tarea!' : 'Sin resultados'}
              </h3>
              <p className="text-slate-400 text-sm max-w-xs">
                {total === 0
                  ? 'Organiza tu trabajo y tu vida con TaskMaster.'
                  : 'Prueba ajustando los filtros de búsqueda.'}
              </p>
              {total === 0 && (
                <Link
                  to="/tasks/new"
                  className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  <Plus size={15} /> Nueva tarea
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
